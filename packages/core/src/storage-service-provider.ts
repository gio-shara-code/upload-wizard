import type {
    RequestSignedUploadUrlResponse,
    GetDataResponse,
    DeleteResponse,
    ExpiresIn,
} from './types'

export abstract class StorageServiceProvider<ID> {
    // TODO: Maybe add metaData to this method
    abstract requestSignedUploadUrl(
        fileId: ID,
        expiresIn: ExpiresIn
    ): Promise<RequestSignedUploadUrlResponse<ID>>

    abstract getData(fileId: ID): Promise<GetDataResponse<ID>>

    abstract delete(fileId: ID): Promise<DeleteResponse>
}
