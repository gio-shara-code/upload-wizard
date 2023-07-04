import { FileStatus } from './storage-service-provider.types'
import { DBFileStatus } from './db-file-provider.types'

export type ExpiresIn = number
export type Expiry = number

export type DefaultID = string

export type Token = string

interface File<ID> {
    id: ID
    status: FileStatus | DBFileStatus
    // TODO: Refactor this so that it makes more sense for single urls
    variants: MediaVariants
}

export type MediaFile<ID> = File<ID>

export type SingleFileURL = string | undefined

export type MediaVariants = string[] | SingleFileURL
