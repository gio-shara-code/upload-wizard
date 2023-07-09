import { S3KeyResolver } from '../src/utils/s3-key-resolver'
import { S3ResourceBucketPath } from '../src/types'

describe('S3KeyResolver', () => {
    const id = '1234'

    describe('single path', () => {
        const path = 'upload'
        const resolver = new S3KeyResolver<string>(path)

        it('should resolve the path correctly', () => {
            const resolvedPath = resolver.resolve(id)

            expect(resolvedPath).toBe(path + '/' + id)
        })
    })
    describe('array of path', () => {
        it('empty array', () => {
            // NOTE: Even though paths should never be empty the resolver
            // doesn't care if it is. Making sure paths match the type is the
            // job of the config parser.

            const paths = []
            const resolver = new S3KeyResolver<S3ResourceBucketPath>(
                paths as [string]
            )

            const resolvedPaths = resolver.resolve(id)

            expect(resolvedPaths).toStrictEqual([])
        })
        it('single string', () => {
            const paths: [string] = ['upload']
            const resolver = new S3KeyResolver<S3ResourceBucketPath>(paths)

            const resolvedPaths = resolver.resolve(id)

            expect(resolvedPaths).toStrictEqual(
                paths.map((path) => path + '/' + id)
            )
        })
        it('multiple string', () => {
            const paths: [string, string, string] = ['small', 'medium', 'large']
            const resolver = new S3KeyResolver<S3ResourceBucketPath>(paths)

            const resolvedPaths = resolver.resolve(id)

            expect(resolvedPaths).toStrictEqual(
                paths.map((path) => path + '/' + id)
            )
        })
    })
})
