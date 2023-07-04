import type { Token } from 'shared-types'
import {FileStatus } from 'shared-types'

export const DBFileStatus = {
  [FileStatus.REQUESTED]: FileStatus.REQUESTED,
  [FileStatus.UPLOADED]: FileStatus.UPLOADED,
} as const

export type DBFileStatusType = keyof typeof DBFileStatus

export interface CreateEntryInput<ID> {
  id: ID
  confirmToken: Token
  status: DBFileStatusType
}
