import { parseEnv } from 'znv'
import { z } from 'zod'

const {
    AWS_S3_BUCKET_NAME,
    AWS_S3_BUCKET_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
} = parseEnv(process.env, {
    AWS_S3_BUCKET_NAME: z.string().optional(),
    AWS_S3_BUCKET_REGION: z.string().optional(),

    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
})

export default Object.freeze({
    s3: {
        region: AWS_S3_BUCKET_REGION,
        name: AWS_S3_BUCKET_NAME,
    },
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    accessKeyId: AWS_ACCESS_KEY_ID,
})
