import type { StorageServiceProvider } from '@providers/interface'
import type { DBFileProvider } from '@adapters/interface'

import { FileStatus } from '@shared/types'

import type { DefaultID, Token, MediaFile } from '@shared/types'

import { uuidV4 } from './utils/uuid'

import type { UploadWizardConfig, SignedUploadUrl } from './types'

export class UploadWizard<ID = DefaultID> {
    private storageServiceProvider: StorageServiceProvider<ID>
    private dbFileProvider: DBFileProvider<ID>
    private readonly idGenerator: () => ID

    constructor(config: UploadWizardConfig<ID>) {
        this.storageServiceProvider = config.storageServiceProvider
        this.dbFileProvider = config.dbFileProvider

        if (!config.customIdGenerator) {
            this.idGenerator = () => {
                return uuidV4() as ID
            }
        } else {
            this.idGenerator = config.customIdGenerator
        }
    }

    private tokenGenerator(): Token {
        return uuidV4()
    }

    async signedUploadUrl(): Promise<SignedUploadUrl<ID>> {
        const id = this.idGenerator()

        const { url, expiry } =
            await this.storageServiceProvider.signedUploadUrl(id, 3600)

        const confirmToken = this.tokenGenerator()

        await this.dbFileProvider.createEntry({
            id,
            confirmToken,
            status: FileStatus.REQUESTED,
        })

        return {
            id,
            confirmToken,
            url,
            expiry,
        }
    }

    async confirmUpload(imageId: ID, confirmToken: string): Promise<void> {
        const confirmTokenIsValid =
            await this.dbFileProvider.validateConfirmToken(
                imageId,
                confirmToken
            )

        if (!confirmTokenIsValid) {
            // TODO: Throw a custom error
            throw new Error('Invalid confirm token')
        }

        const { status } = await this.storageServiceProvider.getData(imageId)

        if (status === FileStatus.NOT_FOUND) {
            throw new Error('File not found')
        }

        await this.dbFileProvider.updateStatus(imageId, FileStatus.UPLOADED)
    }

    async getData(fileId: ID): Promise<MediaFile<ID>> {
        const { status, variants } = await this.storageServiceProvider.getData(
            fileId
        )

        if (status === FileStatus.NOT_FOUND) {
            const imageExistsInDB = await this.dbFileProvider.exists(fileId)

            if (!imageExistsInDB) {
                throw new Error('File not found')
            }

            return {
                id: fileId,
                status: FileStatus.REQUESTED,
                variants: undefined,
            }
        }

        return {
            id: fileId,
            status,
            variants,
        }
    }

    async delete(fileId: ID): Promise<void> {
        const fileExistsInDB = await this.dbFileProvider.exists(fileId)

        if (!fileExistsInDB) {
            throw new Error('File not found')
        }

        await this.dbFileProvider.deleteEntry(fileId)
        return this.storageServiceProvider.delete(fileId)
    }
}
