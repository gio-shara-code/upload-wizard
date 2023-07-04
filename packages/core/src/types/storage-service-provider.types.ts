import type { MediaFile } from './common.types'
import type { SignedUploadUrl } from './upload-wizard.types'

export const FileStatus = {
    UPLOADED: 'UPLOADED',
    PROCESSED: 'PROCESSED',
    NOT_FOUND: 'NOT_FOUND',
} as const

export type FileStatus = keyof typeof FileStatus

export type RequestSignedUploadUrlResponse<ID> = Pick<
    SignedUploadUrl<ID>,
    'id' | 'url' | 'expiry'
>

export type GetDataResponse<ID> = MediaFile<ID> & {
    uploadedAt?: Date
}

export type DeleteResponse = void
