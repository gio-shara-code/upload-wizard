import { UploadWizard } from '@server/core'
import { S3Provider } from '@providers/s3'
import { DBFileProvider } from "@adapters/interface";

class DBProvider extends DBFileProvider<string> {
    createEntry(input: any): Promise<void> {
        return Promise.resolve(undefined)
    }

    deleteEntry(fileId: string): Promise<void> {
        return Promise.resolve(undefined)
    }

    updateStatus(fileId: string, status: any): Promise<void> {
        return Promise.resolve(undefined)
    }

    validateConfirmToken(
        fileId: string,
        confirmToken: string
    ): Promise<boolean> {
        return Promise.resolve(true)
    }

    exists(fileId: string): Promise<boolean> {
        return Promise.resolve(true)
    }
}

export const uploadWizard = new UploadWizard({
    dbFileProvider: new DBProvider(),
    storageServiceProvider: new S3Provider({
        bucketPath: 'uploads',
        acl: 'public-read',
        optimisticFileDataResponse: true,
    }),
})
