import { StorageServiceProvider } from '@providers/interface'
import { FileStatus } from 'shared-types'

import { S3Clients } from './utils/s3-client'
import { S3ProviderConfigurationParser } from './utils/s3-provider-configuration-parser'
import { S3KeyResolvers } from './utils/s3-key-resolver'

import type {
    DeleteRequest,
    GetDataRequest,
    SignedUploadUrlRequest,
} from '@providers/interface'
import type { ExpiresIn } from 'shared-types'

import type {
    Buckets,
    S3ProviderConfiguration,
    S3ProviderConfigurationParsed,
    S3ResourceBucketPath,
} from './types'
import { S3ResourceBucket, S3UploadBucket } from './utils/s3-bucket'

export class S3Provider<ID> extends StorageServiceProvider<ID> {
    private readonly configuration: S3ProviderConfigurationParsed
    private readonly buckets: Buckets<ID>

    constructor(configuration: S3ProviderConfiguration) {
        super()

        const configurationParser = new S3ProviderConfigurationParser()

        this.configuration = configurationParser.parse(configuration)

        const clients = new S3Clients({
            uploadClientRegion: this.configuration.bucketRegion,
            resourceClientRegion:
                this.configuration.resourceBucket.bucketRegion,
        })

        const keyResolver = new S3KeyResolvers({
            uploadBucketPath: this.configuration.bucketPath,
            resourceBucketPath: this.configuration.resourceBucket.bucketPath,
        })

        this.buckets = {
            upload: new S3UploadBucket<ID>(clients.upload, keyResolver.upload, {
                bucketName: this.configuration.bucketName,
                bucketRegion: this.configuration.bucketRegion,
                bucketPath: this.configuration.bucketPath,
            }),
            resource: new S3ResourceBucket<ID>(
                clients.resource,
                keyResolver.resource,
                {
                    ...this.configuration.resourceBucket,
                }
            ),
        }
    }

    async signedUploadUrl(
        fileId: ID,
        expiresIn: ExpiresIn
    ): SignedUploadUrlRequest<ID> {
        // NOTE: It might be interesting to use https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-presigned-post/
        //       to generate a presigned POST request. This however requires a lot of additional work since the FE needs to have
        //       additional data to send the request. Not just the URL.
        const url = await this.buckets.upload.getSignedUploadUrl(
            fileId,
            expiresIn,
            {
                ACL: this.configuration.acl,
                ContentType: 'text/plain',
            }
        )

        const parsedUrl = new URL(url)
        const date = parsedUrl.searchParams.get('X-Amz-Date')

        if (!date) {
            throw new Error('Could not parse expiry date from url')
        }

        // Converts 20210914T123456Z to 2021-09-14T12:34:56Z
        // TODO: check if this could be done in a better way
        const expiry = Date.parse(
            date.replace(
                /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
                '$1-$2-$3T$4:$5:$6'
            )
        )

        return {
            id: fileId,
            url,
            expiry,
        }
    }

    private async createFileUrls(
        fileId: ID,
        optimistic: boolean
    ): Promise<string[]> {
        if (optimistic) {
            return this.buckets.resource.getSignedDownloadUrls(fileId)
        }

        const existingKeys = await this.buckets.resource.existingKeys(fileId)

        if (existingKeys.length > 0) {
            return this.buckets.resource.getSignedDownloadUrls(
                fileId,
                existingKeys as unknown as S3ResourceBucketPath
            )
        }

        return []
    }

    async getData(fileId: ID, optimistic = false): GetDataRequest<ID> {
        // TODO: Refactor the file check

        const variants = await this.createFileUrls(fileId, optimistic)

        if (
            variants.length ===
            this.configuration.resourceBucket.bucketPath.length
        ) {
            return {
                id: fileId,
                variants,
                status: FileStatus.PROCESSED,
            }
        }

        if (variants.length > 0) {
            return {
                id: fileId,
                variants,
                status: FileStatus.UPLOADED,
            }
        }

        if (!optimistic && !this.buckets.upload.equals(this.buckets.resource)) {
            const existsInUploadBucket = await this.buckets.upload.keyExists(
                this.buckets.upload.keyResolver.resolve(fileId),
                {}
            )

            if (existsInUploadBucket) {
                return {
                    id: fileId,
                    variants: [],
                    status: FileStatus.UPLOADED,
                }
            }
        }

        return {
            id: fileId,
            variants: [],
            status: FileStatus.NOT_FOUND,
        }
    }

    async delete(fileId: ID): DeleteRequest {
        // TODO: Handle errors
        // TODO: Handle delete of non existing files

        await this.buckets.resource.deleteObjects(fileId)
    }
}
