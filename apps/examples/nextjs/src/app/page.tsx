'use client'
import { useMemo, useState } from 'react'
import PrimaryButton from "@components/atoms/buttons/Primary";
import StepSection from "./StepSection";
import {UploadHandler} from "../utils/upload_handler";
import {Step} from "../types/step";



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
                    onClick={() =>
                        setDone((prevState) => !prevState)
                    }
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
                                type="file"
                                disabled={disabled}
                            />
                        </div>
                    )}
                </StepSection>

                <StepSection number={2} active={step === Step.REQUEST_UPLOAD_URL}>
                    {(disabled) => (
                        <PrimaryButton disabled={disabled}>Request Upload URL</PrimaryButton>
                    )}
                </StepSection>

                <StepSection number={3} active={step === Step.UPLOAD_FILE}>
                    {(disabled) => (
                        <PrimaryButton disabled={disabled}>Upload File</PrimaryButton>
                    )}
                </StepSection>

                <StepSection number={4} active={step === Step.CONFIRM_UPLOAD}>
                    {(disabled) => (
                        <PrimaryButton disabled={disabled}>Confirm Upload</PrimaryButton>
                    )}
                </StepSection>

                <StepSection number={5} active={step === Step.POLL_FILE}>
                    {(disabled) => (
                        <PrimaryButton disabled={disabled}>Poll File</PrimaryButton>
                    )}
                </StepSection>
            </section>
        </main>
    )
}




