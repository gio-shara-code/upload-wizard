import { ObjectCannedACL } from "@aws-sdk/client-s3";

export interface S3ProviderOptions {
  /**
   * The path to the bucket where the file will be uploaded.
   *
   * @default 'uploads'
   * @example 'uploads/images'
   * @description This package will not create the bucket for you nor will it check
   * if the bucket exists. You must create the bucket yourself. Furthermore, there
   * are no checks to see if the bucket path is valid.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
   */
  bucketPath?: string
  /**
   * The canned ACL to apply to the object. Defaults to `public-read`.
   */
  acl?: ObjectCannedACL
  /**
   * Whether the file response should be optimistic or not.
   *
   * @default true
   * @description If set to false it will make an additional request to the S3 API to check if the file exists.
   * If the file does not exist, the `status` property of the response will be set to `NOT_FOUND`.
   * If the file does exist, the `status` property of the response will be set to `PROCESSED`.
   */
  optimisticFileDataResponse?: boolean
}
