import { StorageServiceFileStatus } from '@providers/interface'
import { DBFileStatus } from '@adapters/interface'

import { randomInt } from 'node:crypto'

import { UploadWizard } from '../src'
import {
    FakeDB,
    FakeDBFileProvider,
    FakeStorageService,
    FakeStorageServiceProvider,
} from './fakes'

describe('UploadWizard', () => {
    const fakeDB = new FakeDB()
    const fakeStorageService = new FakeStorageService()

    afterEach(() => {
        fakeDB.reset()
        fakeStorageService.reset()
    })

    const storageServiceProvider = new FakeStorageServiceProvider(
        fakeStorageService
    )
    const dbFileProvider = new FakeDBFileProvider(fakeDB)

    const customIdGenerator = () => randomInt(2 ^ 48)

    const cases = [undefined, customIdGenerator]

    describe.each(cases)('customIdGenerator: %p', (args) => {
        const uploadWizard = new UploadWizard({
            storageServiceProvider,
            dbFileProvider,
            customIdGenerator: args,
        })

        describe('signedUploadUrl', () => {
            it('should correctly request a signed upload url', async () => {
                const { id, expiry, confirmToken, url } =
                    await uploadWizard.signedUploadUrl()

                const dbEntry = fakeDB.find(id)
                const storageServiceEntry = fakeStorageService.find(id)

                expect(dbEntry).toEqual({
                    id,
                    status: DBFileStatus.REQUESTED,
                    confirmToken,
                })

                expect(storageServiceEntry).toEqual({
                    id,
                    uploaded: false,
                })
            })
        })

        describe('confirmUpload', () => {
            it('should correctly confirm an upload', async () => {
                const { id, confirmToken } =
                    await uploadWizard.signedUploadUrl()

                fakeStorageService.update(id, { uploaded: true })

                await uploadWizard.confirmUpload(id, confirmToken)

                const dbEntry = fakeDB.find(id)
                const storageServiceEntry = fakeStorageService.find(id)

                expect(dbEntry).toEqual({
                    id,
                    status: DBFileStatus.UPLOADED,
                    confirmToken,
                })

                expect(storageServiceEntry).toEqual({
                    id,
                    uploaded: true,
                })
            })

            it('should throw an error if the confirm token is invalid', async () => {
                const { id, confirmToken } =
                    await uploadWizard.signedUploadUrl()

                await expect(
                    uploadWizard.confirmUpload(id, 'invalid-token')
                ).rejects.toThrow('Invalid confirm token')
            })

            it('should throw an error if the file was not uploaded', async () => {
                const { id, confirmToken } =
                    await uploadWizard.signedUploadUrl()

                await expect(
                    uploadWizard.confirmUpload(id, confirmToken)
                ).rejects.toThrow('File not found')
            })
        })

        describe('getData', () => {
            it('should throw an error if the file was not found', async () => {
                await expect(uploadWizard.getData('some-id')).rejects.toThrow(
                    'File not found'
                )
            })

            it('should return the correct data if the file has not been uploaded yet', async () => {
                const { id } = await uploadWizard.signedUploadUrl()

                const data = await uploadWizard.getData(id)

                expect(data).toEqual({
                    id,
                    status: DBFileStatus.REQUESTED,
                    variants: undefined,
                })
            })

            it('should return the correct data if the file has been uploaded', async () => {
                const { id, confirmToken } =
                    await uploadWizard.signedUploadUrl()

                fakeStorageService.update(id, { uploaded: true })

                await uploadWizard.confirmUpload(id, confirmToken)

                const data = await uploadWizard.getData(id)

                expect(data).toEqual({
                    id,
                    status: DBFileStatus.UPLOADED,
                    variants: undefined,
                })
            })

            it('should return the correct data if the file has been uploaded and has variants', async () => {
                const { id, confirmToken } =
                    await uploadWizard.signedUploadUrl()

                fakeStorageService.update(id, { uploaded: true })

                await uploadWizard.confirmUpload(id, confirmToken)

                const url = 'https://example.com/image.jpg'

                fakeStorageService.update(id, { url })

                const data = await uploadWizard.getData(id)

                expect(data).toEqual({
                    id,
                    status: StorageServiceFileStatus.PROCESSED,
                    variants: url,
                })
            })
        })

        describe('delete', () => {
            it('should delete the file from the database and storage service correctly', async () => {
                const { id, confirmToken } =
                    await uploadWizard.signedUploadUrl()

                fakeStorageService.update(id, { uploaded: true })

                await uploadWizard.confirmUpload(id, confirmToken)

                await uploadWizard.delete(id)

                expect(fakeDB.find(id)).toBeUndefined()
                expect(fakeStorageService.find(id)).toBeUndefined()
            })

            it('should throw an error if the file was not found', async () => {
                await expect(uploadWizard.delete('some-id')).rejects.toThrow(
                    'File not found'
                )
            })
        })
    })
})
