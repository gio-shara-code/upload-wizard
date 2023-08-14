import { z } from 'zod'
import { FileStatus, MediaFile } from 'shared-types'

export const RequestSignedURLReturnObject = z.object({
    id: z.string(), // QUESTION is it a uuid? If yes we can add .uuid()
    url: z.string().url(),
    confirmToken: z.string(),
    expiry: z.number(), //
})

export const GetFileReturnObject = z.object({
    id: z.string().optional(),
    status: z.enum([FileStatus.UPLOADED, FileStatus.PROCESSED]).optional(),
    variants: z
        .union([z.array(z.string()), z.string(), z.undefined()])
        .optional(),
})

export class UploadHandler {
    constructor(private controller: AbortController) {
        this.controller = controller
    }

    abort = () => {
        this.controller.abort()
    }

    /**
     * @deprecated This "all-in-one" method is deprecated in favor of the more granular methods below.
     * */
    upload = async (file: File) => {
        const { url, confirmToken, id } = await this.requestSignedURL()
        console.log('url', url)
        await this.uploadImage(file, url)

        await this.confirmUpload(id, confirmToken)

        return await this.pollFileUntilReady(id)
    }

    requestSignedURL = async () => {
        const res = await fetch('/api/users/1/images', {
            method: 'POST',
            signal: this.controller.signal,
        })

        if (!res.ok) {
            throw new Error('Failed to request signed URL')
        }

        return RequestSignedURLReturnObject.parse(await res.json())
    }

    uploadImage = async (file: File, signedURL: string) => {
        const res = await fetch(signedURL, {
            method: 'PUT',
            signal: this.controller.signal,
            body: file,
        })

        if (!res.ok) {
            throw new Error('Failed to upload file')
        }
    }

    confirmUpload = async (id: string, confirmToken: string) => {
        const res = await fetch(`/api/users/1/images/${id}/confirm`, {
            method: 'POST',
            signal: this.controller.signal,
            body: JSON.stringify({ confirmToken }),
        })

        if (!res.ok) throw new Error('Failed to confirm upload')
    }

    getFile = async (id: string) => {
        const res = await fetch(`/api/users/1/images/${id}`, {
            method: 'GET',
            signal: this.controller.signal,
        })

        if (!res.ok) throw new Error('Failed to get file')

        const bodyJson = await res.json()

        console.log('getFile:res', bodyJson)
        return GetFileReturnObject.parse(bodyJson)
    }

    pollFileUntilReady = async (id: string) => {
        let file = await this.getFile(id)

        // NOTE this constantly pulls an empty object, why is it happening?
        while (file.status !== FileStatus.UPLOADED) {
            await new Promise((resolve) => setTimeout(resolve, 1000))

            file = await this.getFile(id)
        }

        return file
    }
}
