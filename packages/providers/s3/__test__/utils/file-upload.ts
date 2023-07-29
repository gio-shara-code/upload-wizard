import { S3Provider } from '../../src'

export const uploadFile = async (url: string, file: Blob) => {
    const response = await fetch(url, {
        method: 'PUT',
        body: file,
    })

    expect(response.status).toBe(200)
    expect(response.ok).toBe(true)
}

export const addFile = async (
    provider: S3Provider<string>,
    id: string,
    file: Blob
) => {
    const { url } = await provider.signedUploadUrl(id, 2000)
    await uploadFile(url, file)
}
