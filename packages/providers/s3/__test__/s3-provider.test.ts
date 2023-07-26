import { S3Provider, S3ProviderConfiguration } from '../src'
import { FileStatus } from 'shared-types'
import { S3KeyResolvers } from '../src/utils/s3-key-resolver'
import { afterEach } from 'node:test'
import { resetS3Mock } from './s3-mock/localstack'

const expectS3Url = (
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

const uploadFile = async (url: string, file: Blob) => {
    const response = await fetch(url, {
        method: 'PUT',
        body: file,
    })

    expect(response.status).toBe(200)
    expect(response.ok).toBe(true)
}

const addFile = async (
    provider: S3Provider<string>,
    id: string,
    file: Blob
) => {
    const { url } = await provider.signedUploadUrl(id, 2000)
    await uploadFile(url, file)
}

describe('S3Provider', () => {
    const options: S3ProviderConfiguration = {
        bucketPath: 'upload',
        bucketRegion: 'eu-central-1',
        bucketName: 'test-bucket',
    }

    afterEach(async () => {
        await resetS3Mock()
    })

    const file = new Blob(['Hello World'], { type: 'text/plain' })

    const fileId = '1234'
    const expiresIn = 2000

    it('should return a correctly signed upload url', async () => {
        const provider = new S3Provider({
            ...options,
        })

        const { url, id, expiry } = await provider.signedUploadUrl(
            fileId,
            expiresIn
        )

        const date = new Date(expiry)
        const parsedDate = date
            .toISOString()
            .replace(/[:-]/g, '')
            .replace(/\.\d{3}/, '')

        const parsedUrl = new URL(url)
        const searchParams = parsedUrl.searchParams

        expectS3Url(parsedUrl, 'upload', fileId)

        expect(searchParams.get('X-Amz-Date')).toBe(parsedDate)
        expect(searchParams.get('X-Amz-Expires')).toBe(expiresIn.toString())
        expect(searchParams.get('x-amz-acl')).toBe('bucket-owner-full-control')
        expect(searchParams.get('x-id')).toBe('PutObject')

        expect(id).toBe(fileId)
    })

    test('uploading a file to the signed url', async () => {
        const provider = new S3Provider({
            ...options,
        })

        const { url } = await provider.signedUploadUrl(fileId, expiresIn)

        await uploadFile(url, file)
    })

    const cases: Partial<S3ProviderConfiguration>[] = [
        {
            optimisticFileDataResponse: true,
        },
        {
            optimisticFileDataResponse: false,
        },
    ]

    it.each(cases)(
        'should return a correctly signed download url, %p',
        async (p) => {
            const provider = new S3Provider<string>({
                ...options,
                ...p,
            })

            await addFile(provider, fileId, file)

            const { status, variants } = await provider.getData(fileId)

            const url = new URL(variants[0])
            const searchParams = url.searchParams

            expect(status).toBe(FileStatus.PROCESSED)
            expect(variants).toHaveLength(1)

            expectS3Url(url, 'upload', fileId, false)

            expect(searchParams.get('X-Amz-Expires')).toBe('900')
            expect(searchParams.get('x-id')).toBe('GetObject')
        }
    )

    it('should delete a file', async () => {
        const provider = new S3Provider<string>({
            ...options,
            // TODO: When set to `true` the status of the file is "PROCESSED"
            //  since it does not check if the file actually exists
            optimisticFileDataResponse: false,
        })

        await addFile(provider, fileId, file)

        await provider.delete(fileId)

        const { status } = await provider.getData(fileId)

        expect(status).toBe(FileStatus.NOT_FOUND)
    })
})
