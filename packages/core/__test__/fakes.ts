import { StorageServiceProvider } from '../src/storage-service-provider'
import { DBFileStatus, FileStatus } from '../src/types'
import { DBFileProvider } from '../src/db-file-provider'

class StorageAdapter<T extends { id: string }> {
    storage: T[] = []

    reset = () => {
        this.storage = []
    }

    add = (element: T) => {
        this.storage.push(element)
    }

    find = (id) => {
        return this.storage.find((element) => element.id === id)
    }

    update = (id, data: Partial<Omit<T, 'id'>>) => {
        const element = this.find(id)

        if (!element) {
            return
        }

        this.storage = this.storage.map((element) => {
            if (element.id === id) {
                return {
                    ...element,
                    ...data,
                }
            }

            return element
        })
    }

    delete = (id) => {
        this.storage = this.storage.filter((element) => element.id !== id)
    }
}

type FakeStorageServiceFile = {
    id: string
    url?: string
    uploaded: boolean
}

export class FakeStorageService extends StorageAdapter<FakeStorageServiceFile> {}

export class FakeStorageServiceProvider<ID> extends StorageServiceProvider<ID> {
    storage: FakeStorageService

    constructor(fakeStorage: FakeStorageService) {
        super();

        this.storage = fakeStorage
    }

    requestSignedUploadUrl(fileId, expiresIn) {
        this.storage.add({
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
        const data = this.storage.find(fileId)

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
        this.storage.delete(fileId)

        return Promise.resolve()
    }
}

type FakeDBFile = {
    id: string
    status: DBFileStatus
    confirmToken?: string
}

export class FakeDB extends StorageAdapter<FakeDBFile> {}

export class FakeDBFileProvider<ID> extends DBFileProvider<ID> {
    storage: FakeDB

    constructor(fakeStorage: FakeDB) {
        super();

        this.storage = fakeStorage
    }

    createEntry(input) {
        this.storage.add({
            id: input.id,
            status: input.status,
            confirmToken: input.confirmToken,
        })

        return Promise.resolve()
    }

    updateStatus(fileId, status) {
        this.storage.update(fileId, { status })

        return Promise.resolve()
    }

    deleteEntry(fileId) {
        this.storage.delete(fileId)

        return Promise.resolve()
    }

    validateConfirmToken(fileId, confirmToken) {
        const file = this.storage.find(fileId)

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
        const file = this.storage.find(fileId)

        return Promise.resolve(!!file)
    }
}
