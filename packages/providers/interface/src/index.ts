import type {
  RequestSignedUploadUrlResponse,
  GetDataResponse,
  DeleteResponse,
} from './types/index.types'

import type { ExpiresIn } from 'shared-types'

export * from './types/index.types'

export abstract class StorageServiceProvider<ID> {
  // TODO: Maybe add metaData to this method
  abstract requestSignedUploadUrl(
    fileId: ID,
    expiresIn: ExpiresIn
  ): Promise<RequestSignedUploadUrlResponse<ID>>

  abstract getData(fileId: ID): Promise<GetDataResponse<ID>>

  abstract delete(fileId: ID): Promise<DeleteResponse>
}
