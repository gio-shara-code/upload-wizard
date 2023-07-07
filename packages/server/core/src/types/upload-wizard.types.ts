import type { Expiry, Token } from '@shared/types'
import { StorageServiceProvider } from '@providers/interface'
import { DBFileProvider } from '@adapters/interface'

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
