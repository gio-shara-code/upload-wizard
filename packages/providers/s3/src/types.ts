import { ObjectCannedACL } from '@aws-sdk/client-s3'
import { z } from 'zod'
import { S3ResourceBucket, S3UploadBucket } from './utils/s3-bucket'

interface S3BucketConfiguration {
    bucketName?: string
    bucketRegion?: string
}

export interface S3DefaultBucketConfiguration extends S3BucketConfiguration {
    /**
     * The name of the s3 bucket.
     *
     * @example 'my-bucket'
     *
     * @description If not provided it will try to use the `AWS_S3_BUCKET`
     * environment variable.
     * If that is not provided it will throw an error.
     */
    bucketName?: string
    /**
     * The region of the s3 bucket.
     *
     * @example 'us-east-1'
     *
     * @description If not provided it will try to use the `AWS_S3_BUCKET_REGION`
     * environment variable.
     * If that is not provided it will throw an error.
     */
    bucketRegion?: string
    /**
     * The path to the bucket where the files will be uploaded to.
     *
     * @example 'uploads/images'
     *
     * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
     */
    bucketPath: string
}

export type S3ResourceBucketPath = readonly [string, ...string[]]

export interface S3ResourceBucketConfiguration extends S3BucketConfiguration {
    /**
     * The name of the bucket where the files will be downloaded from.
     *
     * @example 'my-bucket'
     *
     * @description If not provided it will use the default bucket name.
     * If that is not provided it will throw an error.
     */
    bucketName?: string
    /**
     * The region of the bucket where the files will be downloaded from.
     *
     * @example 'us-east-1'
     *
     * @description If not provided it will use the default bucket region.
     * If that is not provided it will throw an error.
     */
    bucketRegion?: string
    /**
     * The path/s to the bucket where the file will be downloaded from.
     * Useful if you have a processing pipeline that stores the processed files
     * in a different bucket path.
     *
     * @example ['images/original', 'images/thumbnail']
     *
     * @description If not provided it will use the single default bucket path.
     * If that is not provided it will throw an error.
     *
     * @description You can provide an array of paths if you have a custom file processing
     * pipeline. For example if you have different image variants, you can provide an array
     * of paths to the different variants.
     *
     * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
     */
    bucketPath?: S3ResourceBucketPath
}

export interface S3ProviderConfiguration extends S3DefaultBucketConfiguration {
    resourceBucket?: S3ResourceBucketConfiguration
    /**
     * The canned ACL to apply to the object. Defaults to `bucket-owner-full-control`.
     *
     * @default 'bucket-owner-full-control'
     *
     * @description It's recommended to use `bucket-owner-full-control` to ensure that
     * the bucket owner has full control over the objects. AWS recommends to have ACLs
     * disabled on the bucket; read more about it
     * [here]{@link https://docs.aws.amazon.com/AmazonS3/latest/userguide/about-object-ownership.html}.
     *
     * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html#canned-acl
     */
    acl?: ObjectCannedACL
}

export interface S3ProviderConfigurationParsed
    extends Required<S3ProviderConfiguration> {
    resourceBucket: Required<S3ResourceBucketConfiguration>
}

export interface S3ClientHelperConfiguration {
    uploadClientRegion: string
    resourceClientRegion: string
}

export type S3ProviderConfigurationSchema = z.ZodSchema<
    S3ProviderConfigurationParsed,
    z.ZodTypeDef,
    S3ProviderConfiguration
>

export interface Buckets<ID> {
    upload: S3UploadBucket<ID>
    resource: S3ResourceBucket<ID>
}
