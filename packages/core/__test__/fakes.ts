import { StorageServiceProvider } from '../src/storage-service-provider'
import { DBFileStatus, FileStatus } from '../src/types'
import { DBFileProvider } from '../src/db-file-provider'

type FakeStorageService = {
    images: {
        id: string
        url?: string
        uploaded: boolean
    }[]
}

export const fakeStorageService: FakeStorageService = {
    images: [],
}

export class FakeStorageServiceProvider<ID> extends StorageServiceProvider<ID> {
    requestSignedUploadUrl(fileId, expiresIn) {
        fakeStorageService.images.push({
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
        const data = fakeStorageService.images.find(
            (image) => image.id === fileId
        )

        const imageExists = !!data

        if (!imageExists) {
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
        fakeStorageService.images = fakeStorageService.images.filter(
            (image) => image.id !== fileId
        )

        return Promise.resolve()
    }
}

type FakeDB = {
    images: {
        id: string
        status: DBFileStatus
        confirmToken?: string
    }[]
}

export const fakeDB: FakeDB = {
    images: [],
}

export class FakeDBFileProvider<ID> extends DBFileProvider<ID> {
    createEntry(input) {
        fakeDB.images.push({
            id: input.id,
            status: input.status,
            confirmToken: input.confirmToken,
        })

        return Promise.resolve()
    }

    updateStatus(fileId, status) {
        fakeDB.images = fakeDB.images.map((image) => {
            if (image.id === fileId) {
                return {
                    ...image,
                    status,
                }
            }

            return image
        })

        return Promise.resolve()
    }

    deleteEntry(fileId) {
        fakeDB.images = fakeDB.images.filter((image) => image.id !== fileId)

        return Promise.resolve()
    }

    validateConfirmToken(fileId, confirmToken) {
        const image = fakeDB.images.find((image) => image.id === fileId)

        if (!image) {
            return Promise.resolve(false)
        }

        const { confirmToken: imageConfirmToken } = image

        if (imageConfirmToken === confirmToken) {
            return Promise.resolve(true)
        } else {
            return Promise.resolve(false)
        }
    }

    exists(fileId) {
        const image = fakeDB.images.find((image) => image.id === fileId)

        return Promise.resolve(!!image)
    }
}
