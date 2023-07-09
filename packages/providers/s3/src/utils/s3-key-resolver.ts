import { DefaultID } from 'shared-types'
import { S3ResourceBucketPath } from '../types'

export class S3KeyResolver<
    Path extends string | S3ResourceBucketPath,
    ID = DefaultID
> {
    private readonly path: Path

    constructor(path: Path) {
        this.path = path
    }

    private resolveSinglePath(path: string, fileId: ID): string {
        const pathSegments: string[] = [path, String(fileId)]

        return pathSegments.join('/')
    }

    resolve(fileId: ID): Path extends string ? string : S3ResourceBucketPath {
        if (Array.isArray(this.path)) {
            return this.path.map((path) =>
                this.resolveSinglePath(path, fileId)
            ) as unknown as Path extends string ? string : S3ResourceBucketPath
        } else {
            return this.resolveSinglePath(
                this.path as string,
                fileId
            ) as Path extends string ? string : S3ResourceBucketPath
        }
    }
}

export class S3KeyResolvers<ID> {
    private readonly uploadKeyResolver: S3KeyResolver<string, ID>
    private readonly resourceKeyResolver: S3KeyResolver<
        S3ResourceBucketPath,
        ID
    >

    constructor(configuration: {
        uploadBucketPath: string
        resourceBucketPath: S3ResourceBucketPath
    }) {
        this.uploadKeyResolver = new S3KeyResolver(
            configuration.uploadBucketPath
        )
        this.resourceKeyResolver = new S3KeyResolver(
            configuration.resourceBucketPath
        )
    }

    get upload(): S3KeyResolver<string, ID> {
        return this.uploadKeyResolver
    }

    get resource(): S3KeyResolver<S3ResourceBucketPath, ID> {
        return this.resourceKeyResolver
    }
}
