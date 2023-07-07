import type { Expiry, MediaFile } from 'shared-types'
import { FileStatus } from 'shared-types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { REQUESTED, ...FileStatusRest } = FileStatus
export const StorageServiceFileStatus = {
    ...FileStatusRest,
} as const

export type StorageServiceFileStatusType = keyof typeof StorageServiceFileStatus

export type RequestSignedUploadUrlResponse<ID> = {
    id: ID
    url: string
    /**
     * The expiry date in seconds since the Unix epoch.
     */
    expiry: Expiry
}

export type GetDataResponse<ID> = MediaFile<ID> & {
    uploadedAt?: Date
}

export type DeleteResponse = void
