import { z } from 'zod'
import { ObjectCannedACL } from '@aws-sdk/client-s3'

import config from '../config'

import type {
    S3DefaultBucketConfiguration,
    S3ProviderConfiguration,
    S3ProviderConfigurationSchema,
    S3ResourceBucketConfiguration,
} from '../types'

export class ConfigurationParser<Schema extends z.ZodSchema> {
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

export class S3ProviderConfigurationParser {
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
                    bucketPath: z.array(z.string()).nonempty(),
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
