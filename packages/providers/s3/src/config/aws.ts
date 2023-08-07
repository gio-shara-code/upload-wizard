import { parseEnv } from 'znv'
import { z } from 'zod'

const schemas = {
    AWS_S3_BUCKET_NAME: {
        schema: z.string(),
    },
    AWS_S3_BUCKET_REGION: {
        schema: z.string(),
    },
    AWS_ACCESS_KEY_ID: {
        schema: z.string(),
    },
    AWS_SECRET_ACCESS_KEY: {
        schema: z.string(),
    },
}

const {
    AWS_S3_BUCKET_NAME,
    AWS_S3_BUCKET_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
} = parseEnv(process.env, schemas)

const config = Object.freeze({
    s3: {
        region: AWS_S3_BUCKET_REGION,
        name: AWS_S3_BUCKET_NAME,
    },
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    accessKeyId: AWS_ACCESS_KEY_ID,
})

export default config
