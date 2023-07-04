import type { Expiry, Token } from './common.types'
import type { StorageServiceProvider } from '../storage-service-provider'
import type { DBFileProvider } from '../db-file-provider'

export interface SignedUploadUrl<ID> {
    id: ID
    url: string
    /**
     * The expiry date in seconds since the Unix epoch.
     */
    expiry: Expiry
    confirmToken: Token
}

export interface UploadWizardConfig<ID> {
    storageServiceProvider: StorageServiceProvider<ID>
    dbFileProvider: DBFileProvider<ID>
    customIdGenerator?: () => ID
    expiryTime?: number
}
