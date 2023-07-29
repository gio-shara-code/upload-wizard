import { S3Provider, S3ProviderConfiguration } from '../src'
import { FileStatus } from 'shared-types'
import { afterEach } from 'node:test'
import { resetS3Mock } from './s3-mock/localstack'
import { addFile, uploadFile } from './utils/file-upload'
import { expectS3Url } from './helpers/s3-url'

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
