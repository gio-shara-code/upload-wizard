import { S3KeyResolvers } from '../../src/utils/s3-key-resolver'

export const expectS3Url = (
    url: URL,
    path: string,
    fileId: string,
    isUpload = true
) => {
    const s3PathResolver = new S3KeyResolvers({
        uploadBucketPath: path,
        resourceBucketPath: [path],
    })

    expect(url.protocol).toBe('http:')
    expect(url.hostname).toBe('test-bucket.s3.localhost.localstack.cloud')
    expect(url.port).toBe('4566')

    const pathname = url.pathname.slice(1)

    if (isUpload) {
        expect(pathname).toBe(s3PathResolver.upload.resolve(fileId))
    } else {
        expect(s3PathResolver.resource.resolve(fileId)).toContain(pathname)
    }

    const searchParams = url.searchParams

    expect(searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256')
    expect(searchParams.get('X-Amz-Content-Sha256')).toBe('UNSIGNED-PAYLOAD')

    const credentialDateString = new Date()
        .toISOString()
        .replace(/T.*/g, '')
        .replace(/[:-]/g, '')

    expect(searchParams.get('X-Amz-Credential')).toBe(
        `test/${credentialDateString}/eu-central-1/s3/aws4_request`
    )
    expect(searchParams.get('X-Amz-SignedHeaders')).toBe('host')
}
