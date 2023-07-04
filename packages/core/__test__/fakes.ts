import { StorageServiceProvider } from '../src/storage-service-provider'
import { DBFileStatus, FileStatus } from '../src/types'
import { DBFileProvider } from '../src/db-file-provider'

type FakeStorageService = {
    files: {
        id: string
        url?: string
        uploaded: boolean
    }[]
}

export const fakeStorageService: FakeStorageService = {
    files: [],
}

export class FakeStorageServiceProvider<ID> extends StorageServiceProvider<ID> {
    requestSignedUploadUrl(fileId, expiresIn) {
        fakeStorageService.files.push({
            id: fileId,
            uploaded: false,
        })

        return Promise.resolve({
            id: fileId,
            expiry: new Date().getTime() + expiresIn,
            url: 'https://www.example.com/upload-url',
        })
    }

    getData(fileId) {
        const data = fakeStorageService.files.find(
            (file) => file.id === fileId
        )

        const fileExists = !!data

        if (!fileExists) {
            return Promise.resolve({
                id: fileId,
                status: FileStatus.NOT_FOUND,
                variants: undefined,
            })
        }

        const { uploaded, url } = data

        if (!uploaded) {
            return Promise.resolve({
                id: fileId,
                status: FileStatus.NOT_FOUND,
                variants: undefined,
            })
        }

        return Promise.resolve({
            id: fileId,
            status: url ? FileStatus.PROCESSED : FileStatus.UPLOADED,
            variants: url,
        })
    }

    delete(fileId) {
        fakeStorageService.files = fakeStorageService.files.filter(
            (file) => file.id !== fileId
        )

        return Promise.resolve()
    }
}

type FakeDB = {
    files: {
        id: string
        status: DBFileStatus
        confirmToken?: string
    }[]
}

export const fakeDB: FakeDB = {
    files: [],
}

export class FakeDBFileProvider<ID> extends DBFileProvider<ID> {
    createEntry(input) {
        fakeDB.files.push({
            id: input.id,
            status: input.status,
            confirmToken: input.confirmToken,
        })

        return Promise.resolve()
    }

    updateStatus(fileId, status) {
        fakeDB.files = fakeDB.files.map((file) => {
            if (file.id === fileId) {
                return {
                    ...file,
                    status,
                }
            }

            return file
        })

        return Promise.resolve()
    }

    deleteEntry(fileId) {
        fakeDB.files = fakeDB.files.filter((file) => file.id !== fileId)

        return Promise.resolve()
    }

    validateConfirmToken(fileId, confirmToken) {
        const file = fakeDB.files.find((file) => file.id === fileId)

        if (!file) {
            return Promise.resolve(false)
        }

        const { confirmToken: uploadConfirmToken } = file

        if (uploadConfirmToken === confirmToken) {
            return Promise.resolve(true)
        } else {
            return Promise.resolve(false)
        }
    }

    exists(fileId) {
        const file = fakeDB.files.find((file) => file.id === fileId)

        return Promise.resolve(!!file)
    }
}
