import { parseEnv } from 'znv'
import { z } from 'zod'

const { S3_BUCKET_NAME, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } =
    parseEnv(process.env, {
        S3_BUCKET_NAME: z.string().optional(),
        S3_REGION: z.enum(['eu-central-1']).default('eu-central-1'),
        AWS_ACCESS_KEY_ID: z.string(),
        AWS_SECRET_ACCESS_KEY: z.string(),
    })

export default Object.freeze({
    s3: {
        region: S3_REGION,
        bucket: S3_BUCKET_NAME,
    },
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    accessKeyId: AWS_ACCESS_KEY_ID,
    defaultRegion: S3_REGION || 'eu-central-1',
})
