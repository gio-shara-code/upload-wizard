'use client'

import { useEffect, useMemo, useState } from 'react'
import { MediaFile, FileStatus } from 'shared-types'
import { SignedUploadUrl } from '@server/core'
import { z } from 'zod'

class UploadHandler {
    constructor(private controller: AbortController) {
        this.controller = controller
    }

    abort = () => {
        this.controller.abort()
    }

    upload = async (file: File) => {
        const { url, confirmToken, id } = await this.requestSignedURL()

        await this.uploadImage(file, url)

        await this.confirmUpload(id, confirmToken)

        return await this.pollFileUntilReady(id)
    }

    private requestSignedURL = async (): Promise<SignedUploadUrl<string>> => {
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

    private uploadImage = async (file: File, signedURL: string) => {
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

    private confirmUpload = async (id: string, confirmToken: string) => {
        const res = await fetch(`/api/users/1/images/${id}/confirm`, {
            method: 'POST',
            signal: this.controller.signal,
            body: JSON.stringify({ confirmToken }),
        })

        if (!res.ok) {
            throw new Error('Failed to confirm upload')
        }
    }

    private getFile = async (id: string): Promise<MediaFile<string>> => {
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

    private pollFileUntilReady = async (
        id: string
    ): Promise<MediaFile<string>> => {
        let file = await this.getFile(id)

        while (file.status === FileStatus.PROCESSED) {
            await new Promise((resolve) => setTimeout(resolve, 1000))

            file = await this.getFile(id)
        }

        return file
    }
}

export default function Home() {
    const [data, setData] = useState<{ message: string } | null>()
    const controller = useMemo(() => new AbortController(), [])

    useEffect(() => {
        const controller = new AbortController()

        const uploadHandler = new UploadHandler(controller)

        const uploadFile = async () => {
            const file = new File(['test'], 'test.txt', { type: 'text/plain' })

            try {
                try {
                    const mediaFile = await uploadHandler.upload(file)
                    setData({ message: `File uploaded: ${mediaFile.variants}` })
                } catch (err) {
                    setData({ message: `Upload aborted: ${err}` })
                }
            } catch (err) {
                console.error(err)
            }
        }

        uploadFile()

        return () => {
            uploadHandler.abort()
        }
    }, [])

    return (
        <main className={'bg-cyan-900 h-screen text-gray-50'}>
            <h1>Upload Wizard - Next.js Example</h1>
            <p>Data: {data?.message}</p>
        </main>
    )
}
