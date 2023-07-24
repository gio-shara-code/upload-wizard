import { CreateEntryInput, DBFileStatusType } from './types'

export abstract class DBFileProvider<ID> {
    abstract createEntry(input: CreateEntryInput<ID>): Promise<void>

    abstract updateStatus(fileId: ID, status: DBFileStatusType): Promise<void>

    abstract validateConfirmToken(
        fileId: ID,
        confirmToken: string
    ): Promise<boolean>

    abstract deleteEntry(fileId: ID): Promise<void>

    abstract exists(fileId: ID): Promise<boolean>
}
