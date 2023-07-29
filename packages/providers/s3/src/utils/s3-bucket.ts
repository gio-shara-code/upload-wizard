import {
    DeleteObjectsCommand,
    DeleteObjectsCommandInput,
    GetObjectCommand,
    GetObjectCommandInput,
    HeadObjectCommand,
    HeadObjectCommandInput,
    PutObjectCommand,
    PutObjectCommandInput,
    S3Client,
    S3ServiceException,
} from '@aws-sdk/client-s3'
import { S3KeyResolver } from './s3-key-resolver'
import {
    S3DefaultBucketConfiguration,
    S3ResourceBucketConfiguration,
} from '../types'
import { ExpiresIn } from 'shared-types'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

abstract class S3Bucket<
    Config extends
        | Required<S3DefaultBucketConfiguration>
        | Required<S3ResourceBucketConfiguration>,
    ID
> {
    readonly client: S3Client
    readonly keyResolver: S3KeyResolver<Config['bucketPath'], ID>
    readonly region: string
    readonly name: string
    readonly path: Config['bucketPath']

    constructor(
        client: S3Client,
        keyResolver: S3KeyResolver<Config['bucketPath'], ID>,
        s3Config: Config
    ) {
        this.client = client
        this.keyResolver = keyResolver
        this.region = s3Config.bucketRegion
        this.name = s3Config.bucketName
        this.path = s3Config.bucketPath
    }

    abstract equals(
        bucket: this extends S3UploadBucket<ID>
            ? S3ResourceBucket<ID>
            : S3UploadBucket<ID>
    ): boolean

    async keyExists(
        key: string,
        commandInput?: Omit<HeadObjectCommandInput, 'Bucket' | 'Key'>
    ): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.name,
                Key: key,
                ...commandInput,
            })

            const { DeleteMarker } = await this.client.send(command)

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
}

export class S3UploadBucket<ID> extends S3Bucket<
    Required<S3DefaultBucketConfiguration>,
    ID
> {
    equals(bucket: S3ResourceBucket<ID>): boolean {
        return (
            this.name === bucket.name &&
            this.region === bucket.region &&
            this.path === bucket.path[0]
        )
    }

    async getSignedUploadUrl(
        fileId: ID,
        expiresIn: ExpiresIn,
        commandInput?: Omit<PutObjectCommandInput, 'Bucket' | 'Key'>
    ) {
        const command = new PutObjectCommand({
            Bucket: this.name,
            Key: this.keyResolver.resolve(fileId),
            ...commandInput,
        })

        return await getSignedUrl(this.client, command, {
            expiresIn: expiresIn,
        })
    }
}

export class S3ResourceBucket<ID> extends S3Bucket<
    Required<S3ResourceBucketConfiguration>,
    ID
> {
    equals(bucket: S3UploadBucket<ID>): boolean {
        return (
            this.name === bucket.name &&
            this.region === bucket.region &&
            this.path[0] === bucket.path
        )
    }

    async getSignedDownloadUrl(
        key: string,
        commandInput?: Omit<GetObjectCommandInput, 'Bucket' | 'Key'>
    ) {
        const command = new GetObjectCommand({
            Bucket: this.name,
            Key: key,
            ...commandInput,
        })

        return await getSignedUrl(this.client, command)
    }

    async getSignedDownloadUrls(
        fileId: ID,
        keys = this.keyResolver.resolve(fileId),
        commandInput?: Omit<GetObjectCommandInput, 'Bucket' | 'Key'>
    ) {
        return Promise.all(
            keys.map((key) =>
                this.getSignedDownloadUrl(key, { ...commandInput })
            )
        )
    }

    async deleteObjects(
        fileId: ID,
        commandInput?: Omit<DeleteObjectsCommandInput, 'Bucket' | 'Delete'> & {
            Delete: Omit<DeleteObjectsCommandInput['Delete'], 'Objects'>
        }
    ) {
        const keys = this.keyResolver.resolve(fileId)

        const command = new DeleteObjectsCommand({
            Bucket: this.name,
            ...commandInput,
            Delete: {
                Objects: keys.map((key) => ({ Key: key })),
                ...commandInput?.Delete,
            },
        })

        return await this.client.send(command)
    }

    async existingKeys(
        fileId: ID,
        commandInput?: Omit<HeadObjectCommandInput, 'Bucket' | 'Key'>
    ) {
        const keys = this.keyResolver.resolve(fileId)

        const responses = await Promise.all(
            keys.map(async (key) => {
                const exists = await this.keyExists(key, {
                    ...commandInput,
                })
                return {
                    key,
                    exists,
                }
            })
        )

        return responses.filter((key) => key.exists).map((key) => key.key)
    }
}
