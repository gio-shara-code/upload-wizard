import { ObjectCannedACL } from '@aws-sdk/client-s3'
import { S3ProviderConfigurationParser } from '../src/utils/s3-provider-configuration-parser'

import type {
    S3ResourceBucketConfiguration,
    S3ProviderConfiguration,
} from '../src/types'

describe('S3ProviderConfigurationParser', () => {
    const parser = new S3ProviderConfigurationParser()

    const bareMinimumConfig: S3ProviderConfiguration = {
        bucketRegion: 'region',
        bucketPath: 'upload',
        bucketName: 'name',
    }

    it('should fill default values', () => {
        // TODO: test if env variables are used correctly

        const output = parser.parse(bareMinimumConfig)

        expect(output).toStrictEqual({
            ...bareMinimumConfig,
            resourceBucket: {
                bucketRegion: bareMinimumConfig.bucketRegion,
                bucketName: bareMinimumConfig.bucketName,
                bucketPath: [bareMinimumConfig.bucketPath],
            },
            acl: ObjectCannedACL.bucket_owner_full_control,
        })
    })

    describe('acl', () => {
        it('should fail if acl does not exist', () => {
            const func = () =>
                parser.parse({
                    ...bareMinimumConfig,
                    acl: 'no-existing-acl',
                } as never)

            expect(func).toThrowError(/Invalid configuration/)
        })
    })

    describe('resourceBucket', () => {
        const cases: S3ResourceBucketConfiguration[] = [
            {
                bucketName: 'resource-bucket-name',
                bucketRegion: 'resource-bucket-region',
            },
            {
                bucketName: 'resource-bucket-name',
                bucketPath: ['resource-bucket-path'],
            },
            {
                bucketRegion: 'resource-bucket-region',
                bucketPath: ['resource-bucket-path'],
            },
        ]

        it.each(cases)(
            'should fill missing key-value with root value %p',
            (config) => {
                const output = parser.parse({
                    ...bareMinimumConfig,
                    resourceBucket: config,
                })

                expect(output.resourceBucket).toStrictEqual({
                    bucketName:
                        config.bucketName ?? bareMinimumConfig.bucketName,
                    bucketRegion:
                        config.bucketRegion ?? bareMinimumConfig.bucketRegion,
                    bucketPath: config.bucketPath ?? [
                        bareMinimumConfig.bucketPath,
                    ],
                })
            }
        )

        it('should throw when passing an empty array for path', () => {
            const func = () =>
                parser.parse({
                    ...bareMinimumConfig,
                    resourceBucket: {
                        bucketPath: [] as never,
                    },
                })

            expect(func).toThrowError(/Invalid configuration/)
        })
    })
})
