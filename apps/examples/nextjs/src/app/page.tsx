'use client'
import { useEffect, useRef, useState } from 'react'
import PrimaryButton from '@components/atoms/buttons/Primary'
import StepSection from './StepSection'
import {
    UploadHandler,
    RequestSignedURLReturnObject,
} from '../utils/upload_handler'
import { Step } from '../types/step'
import { z } from 'zod'
import { Simulate } from 'react-dom/test-utils'

const controller = new AbortController()

const uploadHandler = new UploadHandler(controller)

export default function Home() {
    const [data, setData] = useState<{ message: string } | null>()

    const [step, setStep] = useState<Step>(Step.CHOOSE_FILE)

    const signedURL = useRef<z.infer<
        typeof RequestSignedURLReturnObject
    > | null>(null)

    const pickedFile = useRef<File | null>(null)

    useEffect(() => () => controller.abort(), [])

    const onFilePicked = async (file: File) => {
        console.log('onFilePicked', file.name)

        pickedFile.current = file
        console.log('picked file done', pickedFile.current)
        setStep(Step.REQUEST_UPLOAD_URL)

        try {
            // const mediaFile = await uploadHandler.upload(file)
            // const { url, confirmToken, id } =
            //     await uploadHandler.requestSignedURL()
            // await uploadHandler.uploadImage(file, url)
            //
            // await uploadHandler.confirmUpload(id, confirmToken)
            //
            // const mediaFile = await uploadHandler.pollFileUntilReady(id)
            // setData({ message: `File uploaded: ${mediaFile.variants}` })
        } catch (err) {
            // setData({ message: `Upload aborted: ${err}` })
        }
    }

    const onRequestUploadURL = async () => {
        try {
            signedURL.current = await uploadHandler.requestSignedURL()
            console.log('signed url done', signedURL.current)
            setStep(Step.UPLOAD_FILE)
        } catch (e) {
            console.error('Failed to request signed URL', e)
        }
    }

    const checkFileExists = () => {
        if (pickedFile.current === null) throw new Error('No file picked')
        return pickedFile.current
    }

    const checkSignedURLExists = () => {
        if (signedURL.current === null) throw new Error('No signed url')
        return signedURL.current
    }
    const onUploadFile = async () => {
        try {
            const file = checkFileExists()
            const signedUrl = checkSignedURLExists()
            await uploadHandler.uploadImage(file, signedUrl.url)
            console.log('uploaded file done')
            setStep(Step.CONFIRM_UPLOAD)
        } catch (e) {
            console.error('Failed to upload file', e)
        }
    }

    const onConfirmUpload = async () => {
        try {
            const signedURL = checkSignedURLExists()
            await uploadHandler.confirmUpload(
                signedURL.id,
                signedURL.confirmToken
            )
            console.log('confirmed upload done')
            setStep(Step.POLL_FILE)
        } catch (e) {
            console.error('Failed to confirm upload', e)
        }
    }

    const onPollFile = async () => {
        try {
            const signedURL = checkSignedURLExists()
            const mediaFile = await uploadHandler.pollFileUntilReady(
                signedURL.id
            )
            console.log('poll file done', mediaFile)
            setData({ message: `File uploaded: ${mediaFile.variants}` })
        } catch (e) {
            console.error('Failed to poll file', e)
        }
    }

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
                    onClick={() => setDone((prevState) => !prevState)}
                >
                    Upload
                </h2>

                <StepSection
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
                                accept={'.png'}
                                type="file"
                                disabled={disabled}
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) onFilePicked(file)
                                }}
                            />
                        </div>
                    )}
                </StepSection>

                <StepSection
                    number={2}
                    active={step === Step.REQUEST_UPLOAD_URL}
                >
                    {(disabled) => (
                        <PrimaryButton
                            disabled={disabled}
                            onClick={onRequestUploadURL}
                        >
                            Request Upload URL
                        </PrimaryButton>
                    )}
                </StepSection>

                <StepSection number={3} active={step === Step.UPLOAD_FILE}>
                    {(disabled) => (
                        <PrimaryButton
                            onClick={onUploadFile}
                            disabled={disabled}
                        >
                            Upload File
                        </PrimaryButton>
                    )}
                </StepSection>

                <StepSection number={4} active={step === Step.CONFIRM_UPLOAD}>
                    {(disabled) => (
                        <PrimaryButton
                            onClick={onConfirmUpload}
                            disabled={disabled}
                        >
                            Confirm Upload
                        </PrimaryButton>
                    )}
                </StepSection>

                <StepSection number={5} active={step === Step.POLL_FILE}>
                    {(disabled) => (
                        <PrimaryButton onClick={onPollFile} disabled={disabled}>
                            Poll File
                        </PrimaryButton>
                    )}
                </StepSection>
            </section>
        </main>
    )
}
