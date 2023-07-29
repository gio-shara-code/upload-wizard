import type {
    DeleteRequest,
    GetDataRequest,
    SignedUploadUrlRequest,
} from './types'
import type { ExpiresIn } from 'shared-types'

export abstract class StorageServiceProvider<ID> {
    // TODO: Maybe add metaData to this method
    abstract signedUploadUrl(
        fileId: ID,
        expiresIn: ExpiresIn
    ): SignedUploadUrlRequest<ID>

    /**
     *
     * @param fileId
     * @param optimistic If true, the provider will return the data without checking the existence of the file
     */
    abstract getData(fileId: ID, optimistic?: boolean): GetDataRequest<ID>

    abstract delete(fileId: ID): DeleteRequest
}
