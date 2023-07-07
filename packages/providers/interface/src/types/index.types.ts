import type { Expiry, MediaFile } from 'shared-types'
import { FileStatus } from 'shared-types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { REQUESTED, ...FileStatusRest } = FileStatus
export const StorageServiceFileStatus = {
    ...FileStatusRest,
} as const

export type StorageServiceFileStatusType = keyof typeof StorageServiceFileStatus

type Request<T> = Promise<T>

type SignedUploadUrl<ID> = {
  id: ID
  url: string
  /**
   * The expiry date in seconds since the Unix epoch.
   */
  expiry: Expiry
}

type FileData<ID> = MediaFile<ID> & {
    uploadedAt?: Date
}


export type SignedUploadUrlRequest<ID> = Request<SignedUploadUrl<ID>>

export type GetDataRequest<ID> = Request<FileData<ID>>

export type DeleteRequest= Request<void>
