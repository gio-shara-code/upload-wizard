export type ExpiresIn = number
export type Expiry = number

export type DefaultID = string

export type Token = string

export const FileStatus = {
    REQUESTED: 'REQUESTED',
    UPLOADED: 'UPLOADED',
    PROCESSED: 'PROCESSED',
    NOT_FOUND: 'NOT_FOUND',
} as const

export type FileStatusType = keyof typeof FileStatus

interface File<ID> {
    id: ID
    status: FileStatusType
    // TODO: Refactor this so that it makes more sense for single urls
    variants?: MediaVariants
}

export type MediaFile<ID> = File<ID>

export type SingleFileURL = string

export type MediaVariants = string[] | SingleFileURL
