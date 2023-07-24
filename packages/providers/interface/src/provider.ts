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

    abstract getData(fileId: ID): GetDataRequest<ID>

    abstract delete(fileId: ID): DeleteRequest
}
