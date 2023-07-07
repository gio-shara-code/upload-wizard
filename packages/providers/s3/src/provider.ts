import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
    DeleteObjectCommand,
    DeleteObjectCommandOutput,
    DeleteObjectsCommand,
    DeleteObjectsCommandOutput,
    GetObjectCommand,
    HeadObjectCommand,
    ObjectCannedACL,
    PutObjectCommand,
    S3Client,
    S3ServiceException,
} from '@aws-sdk/client-s3'
import {
    DeleteRequest,
    GetDataRequest,
    SignedUploadUrlRequest,
    StorageServiceProvider,
} from '@providers/interface'
import { ExpiresIn, FileStatus } from 'shared-types'
import { z } from 'zod'

import config from './config'
import {
    S3ClientHelperConfiguration,
    S3DefaultBucketConfiguration,
    S3ProviderConfiguration,
    S3ProviderConfigurationParsed,
    S3ProviderConfigurationSchema,
    S3ResourceBucketConfiguration,
} from './types'

class S3Clients {
    private readonly _uploadClient: S3Client
    private readonly _resourceClient: S3Client

    constructor(configuration: S3ClientHelperConfiguration) {
        const credentials = {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
        }

        this._uploadClient = new S3Client({
            region: configuration.uploadClientRegion,
            credentials,
        })

        if (
            configuration.resourceClientRegion !==
            configuration.uploadClientRegion
        ) {
            this._resourceClient = new S3Client({
                region: configuration.resourceClientRegion,
                credentials,
            })
        } else {
            this._resourceClient = this._uploadClient
        }
    }

    get uploadClient(): S3Client {
        return this._uploadClient
    }

    get resourceClient(): S3Client {
        return this._resourceClient
    }
}

class ConfigurationParser<Schema extends z.ZodSchema> {
    private readonly schema: Schema

    constructor(schema: Schema) {
        this.schema = schema
    }

    isValid(configuration: Schema['_input']) {
        const { success } = this.schema.safeParse(configuration)

        return success
    }

    parse(configuration: Schema['_input']) {
        return this.schema.parse(configuration)
    }
}

class S3ProviderConfigurationParser {
    private readonly configurationParser: ConfigurationParser<S3ProviderConfigurationSchema>

    constructor() {
        const s3ProviderOptionsSchema: S3ProviderConfigurationSchema = z.object(
            {
                bucketName: z.string(),
                bucketRegion: z.string(),
                bucketPath: z.string(),
                resourceBucket: z.object({
                    bucketName: z.string(),
                    bucketRegion: z.string(),
                    bucketPath: z.array(z.string()),
                }),
                acl: z.nativeEnum(ObjectCannedACL),
                optimisticFileDataResponse: z.boolean(),
            }
        )

        this.configurationParser = new ConfigurationParser(
            s3ProviderOptionsSchema
        )
    }

    parse(configuration: S3ProviderConfiguration) {
        const filledConfiguration = this.applyDefaultValues(configuration)

        if (!this.configurationParser.isValid(filledConfiguration)) {
            throw new Error('Invalid configuration')
        }

        return this.configurationParser.parse(filledConfiguration)
    }

    private applyDefaultValues(configuration: S3ProviderConfiguration) {
        const s3DefaultBucketConfiguration: S3DefaultBucketConfiguration = {
            bucketName: configuration.bucketName ?? config.aws.s3.name,
            bucketRegion: configuration.bucketRegion ?? config.aws.s3.region,
            bucketPath: configuration.bucketPath,
        }

        const s3DefaultResourceBucketConfiguration: S3ResourceBucketConfiguration =
            {
                bucketName:
                    configuration.resourceBucket?.bucketName ??
                    s3DefaultBucketConfiguration.bucketName,
                bucketRegion:
                    configuration.resourceBucket?.bucketRegion ??
                    s3DefaultBucketConfiguration.bucketRegion,
                bucketPath: configuration.resourceBucket?.bucketPath ?? [
                    s3DefaultBucketConfiguration.bucketPath,
                ],
            }

        return {
            ...s3DefaultBucketConfiguration,
            resourceBucket: s3DefaultResourceBucketConfiguration,
            acl: configuration.acl ?? ObjectCannedACL.bucket_owner_full_control,
            optimisticFileDataResponse:
                configuration.optimisticFileDataResponse ?? true,
        }
    }
}

class S3KeyResolver<Path extends string | readonly string[], ID> {
    private readonly path: Path

    constructor(path: Path) {
        this.path = path
    }

    private resolveSinglePath(path: string, fileId: ID): string {
        const pathSegments: string[] = [path, String(fileId)]

        return pathSegments.join('/')
    }

    resolve(fileId: ID): Path extends string ? string : readonly string[] {
        if (Array.isArray(this.path)) {
            return this.path.map((path) =>
                this.resolveSinglePath(path, fileId)
            ) as unknown as Path extends string ? string : readonly string[]
        } else {
            return this.resolveSinglePath(
                this.path as string,
                fileId
            ) as Path extends string ? string : readonly string[]
        }
    }
}

class S3KeyResolvers<ID> {
    private readonly uploadKeyResolver: S3KeyResolver<string, ID>
    private readonly resourceKeyResolver: S3KeyResolver<readonly string[], ID>

    constructor(configuration: {
        uploadBucketPath: string
        resourceBucketPath: readonly string[]
    }) {
        this.uploadKeyResolver = new S3KeyResolver(configuration.uploadBucketPath)
        this.resourceKeyResolver = new S3KeyResolver(configuration.resourceBucketPath)
    }

    get upload(): S3KeyResolver<string, ID> {
        return this.uploadKeyResolver
    }

    get resource(): S3KeyResolver<readonly string[], ID> {
        return this.resourceKeyResolver
    }
}

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
