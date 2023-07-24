import {SignedUploadUrl} from "@server/core";
import {z} from "zod";
import {FileStatus, MediaFile} from "shared-types";

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

        await this.uploadImage(file, url)

        await this.confirmUpload(id, confirmToken)

        return await this.pollFileUntilReady(id)
    }

    requestSignedURL = async (): Promise<SignedUploadUrl<string>> => {
        const res = await fetch('/api/users/1/images', {
            method: 'POST',
            signal: this.controller.signal,
        })

        if (!res.ok) {
            throw new Error('Failed to request signed URL')
        }

        const schema = z.object({
            url: z.string(),
            confirmToken: z.string(),
            id: z.string(),
            expiry: z.number(),
        })

        const parsed = schema.parse(await res.json())

        return parsed satisfies SignedUploadUrl<string>
    }

    uploadImage = async (file: File, signedURL: string) => {
        console.log(file)

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

        if (!res.ok) {
            throw new Error('Failed to confirm upload')
        }
    }

    getFile = async (id: string): Promise<MediaFile<string>> => {
        const res = await fetch(`/api/users/1/images/${id}`, {
            method: 'GET',
            signal: this.controller.signal,
        })

        if (!res.ok) {
            throw new Error('Failed to get file')
        }

        const schema = z.object({
            id: z.string(),
            status: z.enum([FileStatus.UPLOADED, FileStatus.PROCESSED]),
            variants: z.union([z.array(z.string()), z.string(), z.undefined()]),
        })

        const parsed = schema.parse(await res.json())

        return parsed satisfies MediaFile<string>
    }

    pollFileUntilReady = async (id: string): Promise<MediaFile<string>> => {
        let file = await this.getFile(id)

        while (file.status === FileStatus.PROCESSED) {
            await new Promise((resolve) => setTimeout(resolve, 1000))

            file = await this.getFile(id)
        }

        return file
    }
}

