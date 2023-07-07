import {
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3ServiceException,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { StorageServiceProvider } from '@providers/interface'
import { FileStatus } from '@shared/types'

import { S3Clients } from './utils/s3-client'
import { S3ProviderConfigurationParser } from './utils/s3-provider-configuration-parser'
import { S3KeyResolvers } from './utils/s3-key-resolver'

import type {
    DeleteObjectCommandOutput,
    DeleteObjectsCommandOutput,
} from '@aws-sdk/client-s3'
import type {
    DeleteRequest,
    GetDataRequest,
    SignedUploadUrlRequest,
} from '@providers/interface'
import type { ExpiresIn } from '@shared/types'

import type {
    S3ProviderConfiguration,
    S3ProviderConfigurationParsed,
} from './types'

export class S3Provider<ID> extends StorageServiceProvider<ID> {
    private readonly clients: S3Clients
    private readonly configuration: S3ProviderConfigurationParsed
    private readonly keyResolver: S3KeyResolvers<ID>

    constructor(configuration: S3ProviderConfiguration) {
        super()

        const configurationParser = new S3ProviderConfigurationParser()

        this.configuration = configurationParser.parse(configuration)

        this.clients = new S3Clients({
            uploadClientRegion: this.configuration.bucketRegion,
            resourceClientRegion:
                this.configuration.resourceBucket.bucketRegion,
        })

        this.keyResolver = new S3KeyResolvers({
            uploadBucketPath: this.configuration.bucketPath,
            resourceBucketPath: this.configuration.resourceBucket.bucketPath,
        })
    }

    async signedUploadUrl(
        fileId: ID,
        expiresIn: ExpiresIn
    ): SignedUploadUrlRequest<ID> {
        // NOTE: It might be interesting to use https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-presigned-post/
        //       to generate a presigned POST request. This however requires a lot of additional work since the FE needs to have
        //       additional data to send the request. Not just the URL.
        const command = new PutObjectCommand({
            Bucket: this.configuration.bucketName,
            Key: this.keyResolver.upload.resolve(fileId),
            ACL: this.configuration.acl,
            ContentType: 'text/plain',
        })

        const url = await getSignedUrl(this.clients.uploadClient, command, {
            expiresIn: expiresIn,
        })

        console.debug('Signed upload URL created for file', url)

        return {
            id: fileId,
            url,
            expiry: new Date().getTime() + expiresIn * 1000,
        }
    }

    private async createFileUrl(key: string): Promise<string> {
        if (this.configuration.acl === 'public-read') {
            return Promise.resolve(
                `https://${this.configuration.bucketName}.s3.${this.configuration.bucketRegion}.amazonaws.com/${key}`
            )
        }

        const command = new GetObjectCommand({
            Bucket: this.configuration.bucketName,
            Key: key,
        })

        return await getSignedUrl(this.clients.resourceClient, command)
    }

    private async createFileUrls(fileId: ID): Promise<string[]> {
        const keys = this.keyResolver.resource.resolve(fileId)

        if (!this.configuration.optimisticFileDataResponse) {
            const keysExists = await Promise.all(
                keys.map(async (key) => {
                    const exists = await this.keyExists(key)
                    return {
                        key,
                        exists,
                    }
                })
            )

            const existingKeys = keysExists
                .filter((key) => key.exists)
                .map((key) => key.key)

            if (existingKeys.length === 0) {
                return []
            } else {
                return Promise.all(
                    existingKeys.map((key) => this.createFileUrl(key))
                )
            }
        }

        return Promise.all(keys.map((key) => this.createFileUrl(key)))
    }

    private async keyExists(key: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.configuration.resourceBucket.bucketName,
                Key: key,
            })

            const { DeleteMarker } = await this.clients.resourceClient.send(
                command
            )

            return DeleteMarker !== true
        } catch (error) {
            if (error instanceof S3ServiceException) {
                if (error.name === 'NotFound') {
                    return false
                }
            }

            throw error
        }
    }

    async getData(fileId: ID): GetDataRequest<ID> {
        // TODO: Refactor the file check

        const variants = await this.createFileUrls(fileId)

        if (variants.length === 0) {
            return {
                id: fileId,
                variants: [],
                status: FileStatus.NOT_FOUND,
            }
        }

        if (
            variants.length !==
            this.configuration.resourceBucket.bucketPath.length
        ) {
            return {
                id: fileId,
                variants,
                status: FileStatus.UPLOADED,
            }
        }

        return {
            id: fileId,
            variants,
            status: FileStatus.PROCESSED,
        }
    }

    private async deleteAllByKeys(
        keys: readonly string[]
    ): Promise<DeleteObjectsCommandOutput> {
        const command = new DeleteObjectsCommand({
            Bucket: this.configuration.bucketName,
            Delete: {
                Objects: keys.map((key) => ({ Key: key })),
            },
        })

        return await this.clients.resourceClient.send(command)
    }

    private async deleteByKey(key: string): Promise<DeleteObjectCommandOutput> {
        const command = new DeleteObjectCommand({
            Bucket: this.configuration.bucketName,
            Key: key,
        })

        return await this.clients.resourceClient.send(command)
    }

    async delete(fileId: ID): DeleteRequest {
        const keys = this.keyResolver.resource.resolve(fileId)

        // TODO: Handle errors
        // TODO: Handle delete of non existing files

        if (keys.length > 1) {
            await this.deleteAllByKeys(keys)
        } else {
            await this.deleteByKey(keys[0])
        }
    }
}
