import type { Token } from './common.types'

export const DBFileStatus = {
    REQUESTED: 'REQUESTED',
    UPLOADED: 'UPLOADED',
} as const

export type DBFileStatus = keyof typeof DBFileStatus

export interface CreateEntryInput<ID> {
    id: ID
    confirmToken: Token
    status: DBFileStatus
    // metaData: ImageMetaData;
}
