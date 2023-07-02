const { S3_BUCKET_NAME, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } =
    process.env
if (!S3_REGION) console.warn('warning: S3_REGION not set')
if (!S3_BUCKET_NAME) console.warn('warning: S3_BUCKET_NAME not set')
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.error('error: AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not set')
    process.exit(-1)
}

export default Object.freeze({
    s3: {
        region: process.env.S3_REGION,
        bucket: process.env.S3_BUCKET_NAME,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    },
    defaultRegion: 'eu-central-1',
})
