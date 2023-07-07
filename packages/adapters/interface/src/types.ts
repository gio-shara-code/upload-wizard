import type { Token } from '@shared/types'
import { FileStatus } from '@shared/types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { PROCESSED, NOT_FOUND, ...FileStatusRest } = FileStatus
export const DBFileStatus = {
    ...FileStatusRest,
} as const

export type DBFileStatusType = keyof typeof DBFileStatus

export interface CreateEntryInput<ID> {
    id: ID
    confirmToken: Token
    status: DBFileStatusType
}
