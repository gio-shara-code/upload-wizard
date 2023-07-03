import config from './config'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export class S3Provider {
    private readonly client = new S3Client({
        region: config.aws.s3.region,
        credentials: {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
        },
    })

    presignedUrl(pathToFile: string) {
        const command = new GetObjectCommand({
            Bucket: config.aws.s3.bucket,
            Key: pathToFile,
        })

        return getSignedUrl(this.client, command, { expiresIn: 3600 })
    }
}
