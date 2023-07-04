import type { Expiry, MediaFile } from 'shared-types';
import { FileStatus } from "shared-types";

export const StorageServiceFileStatus = {
  [FileStatus.UPLOADED]: FileStatus.UPLOADED,
  [FileStatus.PROCESSED]: FileStatus.PROCESSED,
  [FileStatus.NOT_FOUND]: FileStatus.NOT_FOUND,
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
