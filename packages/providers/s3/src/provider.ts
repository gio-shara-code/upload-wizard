import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
    S3Client,
    DeleteObjectCommand,
    PutObjectCommand,
    S3ServiceException,
    GetObjectCommand,
    GetObjectAttributesCommand,
    ObjectCannedACL,
} from '@aws-sdk/client-s3'
import {
    DeleteRequest,
    GetDataRequest,
    SignedUploadUrlRequest,
    StorageServiceProvider,
} from '@providers/interface'
import { ExpiresIn, FileStatus } from 'shared-types'

import config from './config'
import { S3ProviderOptions } from './types'

export class S3Provider<ID> extends StorageServiceProvider<ID> {
    private readonly client = new S3Client({
        region: config.aws.s3.region,
        credentials: {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
        },
    })

    private readonly options: S3ProviderOptions

    private parseOptions(options: S3ProviderOptions) {
        const defaultOptions: S3ProviderOptions = {
            bucketPath: 'uploads',
            acl: ObjectCannedACL.public_read,
            optimisticFileDataResponse: true,
        }

        const filteredOptions = Object.fromEntries(
            Object.entries(options).filter(([k, v]) => v !== undefined)
        )

        return {
            ...defaultOptions,
            ...filteredOptions,
        }
    }

    private resolveFileKey(fileId: ID) {
        const pathSegments = [this.options.bucketPath, `${fileId}.txt`]
        return pathSegments.join('/')
    }

    constructor(options: S3ProviderOptions) {
        super()

        this.options = options
    }

    private async createFileUrl(fileId: ID): Promise<string> {
        if (this.options.acl === 'public-read') {
            return `https://${config.aws.s3.bucket}.s3.${
                config.aws.s3.region
            }.amazonaws.com/${this.resolveFileKey(fileId)}`
        }

        const command = new GetObjectCommand({
            Bucket: config.aws.s3.bucket,
            Key: this.resolveFileKey(fileId),
        })

        return await getSignedUrl(this.client, command)
    }

    async signedUploadUrl(
        fileId: ID,
        expiresIn: ExpiresIn
    ): SignedUploadUrlRequest<ID> {
        // NOTE: It might be interesting to use https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-presigned-post/
        //       to generate a presigned POST request. This however requires a lot of additional work since the FE needs to have
        //       additional data to send the request. Not just the URL.

        console.debug('Creating signed upload URL for file', fileId)

        console.log('ACL', this.options.acl)

        console.log('key', this.resolveFileKey(fileId))

        const command = new PutObjectCommand({
            Bucket: config.aws.s3.bucket,
            Key: this.resolveFileKey(fileId),
            ACL: this.options.acl,
            ContentType: 'text/plain',
        })

        const url = await getSignedUrl(this.client, command, {
            expiresIn: expiresIn,
        })

        console.debug('Signed upload URL created for file', url)

        return {
            id: fileId,
            url,
            expiry: new Date().getTime() + expiresIn * 1000,
        }
    }

    async getData(fileId: ID): GetDataRequest<ID> {
        // TODO: Refactor the file check
        if (!this.options.optimisticFileDataResponse) {
            const notFoundResponse = {
                id: fileId,
                variants: [],
                status: FileStatus.NOT_FOUND,
            }

            try {
                const command = new GetObjectAttributesCommand({
                    Bucket: config.aws.s3.bucket,
                    Key: this.resolveFileKey(fileId),
                    ObjectAttributes: [],
                })

                const { DeleteMarker } = await this.client.send(command)

                if (DeleteMarker) {
                    return notFoundResponse
                }
            } catch (error) {
                if (error instanceof S3ServiceException) {
                    if (error.name === 'NoSuchKey') {
                        return notFoundResponse
                    }
                }

                throw error
            }
        }

        return {
            id: fileId,
            variants: [await this.createFileUrl(fileId)],
            status: FileStatus.PROCESSED,
        }
    }

    async delete(fileId: ID): DeleteRequest {
        const command = new DeleteObjectCommand({
            Bucket: config.aws.s3.bucket,
            Key: this.resolveFileKey(fileId),
        })

        // TODO: Handle error
        await this.client.send(command)
    }
}
