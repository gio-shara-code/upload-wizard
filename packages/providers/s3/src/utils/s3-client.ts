import { S3Client } from '@aws-sdk/client-s3'
import { S3ClientHelperConfiguration } from '../types'
import config from '../config'

export class S3Clients {
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
            endpoint:
                process.env.NODE_ENV === 'test'
                    ? 'http://s3.localhost.localstack.cloud:4566'
                    : undefined,
        })

        if (
            configuration.resourceClientRegion !==
            configuration.uploadClientRegion
        ) {
            this._resourceClient = new S3Client({
                region: configuration.resourceClientRegion,
                credentials,
                endpoint:
                    process.env.NODE_ENV === 'test'
                        ? 'http://s3.localhost.localstack.cloud:4566'
                        : undefined,
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
