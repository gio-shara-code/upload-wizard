'use client'

import { ReactNode, useMemo, useState } from 'react'
import { MediaFile, FileStatus } from 'shared-types'
import { SignedUploadUrl } from '@server/core'
import { z } from 'zod'

enum Step {
    CHOOSE_FILE,
    REQUEST_UPLOAD_URL,
    UPLOAD_FILE,
    CONFIRM_UPLOAD,
    POLL_FILE,
}

class UploadHandler {
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

export default function Home() {
    const [data, setData] = useState<{ message: string } | null>()
    const controller = useMemo(() => new AbortController(), [])
    const uploadHandler = useMemo(
        () => new UploadHandler(controller),
        [controller]
    )
    const [step, setStep] = useState<Step>(Step.CHOOSE_FILE)

    // useEffect(() => {
    //     const controller = new AbortController()
    //
    //     const uploadHandler = new UploadHandler(controller)
    //
    //     const uploadFile = async () => {
    //         const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    //
    //         try {
    //             try {
    //                 const mediaFile = await uploadHandler.upload(file)
    //                 setData({ message: `File uploaded: ${mediaFile.variants}` })
    //             } catch (err) {
    //                 setData({ message: `Upload aborted: ${err}` })
    //             }
    //         } catch (err) {
    //             console.error(err)
    //         }
    //     }
    //
    //     uploadFile()
    //
    //     return () => {
    //         uploadHandler.abort()
    //     }
    // }, [])

    const [done, setDone] = useState(false)

    return (
        <main
            className={
                'bg-cyan-900 h-screen text-gray-50 p-4 flex items-center flex-col'
            }
        >
            <section>
                <h1 className={'text-3xl'}>Upload Wizard - Next.js Example</h1>
            </section>
            <div className={'h-20'} />
            <section className={'flex items-start flex-col gap-4'}>
                <h2
                    className={'text-2xl'}
                    onClick={() => {
                        setDone((prevState) => !prevState)
                    }}
                >
                    Upload
                </h2>

                <Section
                    number={1}
                    active={step === Step.CHOOSE_FILE}
                    done={done}
                >
                    {(disabled) => (
                        <div className={'flex items-start flex-col'}>
                            <label
                                className={'disabled:cursor-not-allowed'}
                                htmlFor="file"
                            >
                                Choose a file
                            </label>
                            <input
                                className={'disabled:cursor-not-allowed'}
                                type="file"
                                disabled={disabled}
                            />
                        </div>
                    )}
                </Section>

                <Section number={2} active={step === Step.REQUEST_UPLOAD_URL}>
                    {(disabled) => (
                        <Button disabled={disabled}>Request Upload URL</Button>
                    )}
                </Section>

                <Section number={3} active={step === Step.UPLOAD_FILE}>
                    {(disabled) => (
                        <Button disabled={disabled}>Upload File</Button>
                    )}
                </Section>

                <Section number={4} active={step === Step.CONFIRM_UPLOAD}>
                    {(disabled) => (
                        <Button disabled={disabled}>Confirm Upload</Button>
                    )}
                </Section>

                <Section number={5} active={step === Step.POLL_FILE}>
                    {(disabled) => (
                        <Button disabled={disabled}>Poll File</Button>
                    )}
                </Section>
            </section>
        </main>
    )
}

interface SectionProps {
    number: number
    active: boolean
    done?: boolean
    children: (disabled: boolean) => ReactNode
}

const Section = ({ children, number, active, done }: SectionProps) => {
    const disabled = useMemo(() => {
        return !active
    }, [active])

    return (
        <section className={'flex items-start gap-4'}>
            <div
                aria-disabled={done ? false : disabled}
                className={
                    'aria-disabled:opacity-50 aria-disabled:pointer-events-none'
                }
            >
                <NumberComponent number={number} done={done} />
            </div>
            <div
                aria-disabled={disabled}
                className={`transition-[max-height] duration-500 overflow-y-auto aria-disabled:opacity-50 aria-disabled:pointer-events-none`}
            >
                {children(disabled)}
            </div>
        </section>
    )
}

interface NumberComponentProps {
    number: number
    done?: boolean
}

const NumberComponent = ({ number, done }: NumberComponentProps) => {
    return (
        <div
            className={`text-lg font-bold text-cyan-900 w-6 h-6 flex justify-center items-center rounded-full ${
                done ? 'bg-green-500' : 'bg-white'
            }`}
        >
            {done ? '✓' : number}
        </div>
    )
}

interface ButtonProps {
    disabled?: boolean
    children: ReactNode
}

const Button = ({ children, disabled }: ButtonProps) => {
    return (
        <button
            className={`bg-orange-300 hover:bg-orange-100 text-gray-800 py-1 px-2 rounded-full disabled:bg-gray-300 disabled:text-gray-500`}
            disabled={disabled}
        >
            {children}
        </button>
    )
}
