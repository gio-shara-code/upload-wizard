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

// NOTE: Maybe we firstly defined zod object and out of the object generate type. The goal here is to have the highest level of type safety and binding between out ts types and zod objects. Just a thought
interface File<ID> {
    id: ID
    status: FileStatusType
    // TODO: Refactor this so that it makes more sense for single urls
    variants?: MediaVariants
}

export type MediaFile<ID> = File<ID>

export type SingleFileURL = string

export type MediaVariants = string[] | SingleFileURL
