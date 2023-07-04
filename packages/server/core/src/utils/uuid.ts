import { randomUUID } from 'crypto'

/**
 * Wrapper around `crypto.randomUUID` to generate a UUID v4
 * that has the entropy cache disabled by default.
 *
 * @returns A UUID v4 string.
 * */
export const uuidV4 = () => randomUUID({ disableEntropyCache: true })
