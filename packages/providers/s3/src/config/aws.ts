import chalk from 'chalk'

const { S3_BUCKET_NAME, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } =
    process.env

if (!S3_REGION) console.log(chalk.yellow('warning: S3_REGION not set'))
if (!S3_BUCKET_NAME)
    console.log(chalk.yellow('warning: S3_BUCKET_NAME not set'))
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.log(
        chalk.red(
            'error: AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY or both not set'
        )
    )
    process.exit(-1)
}

export default Object.freeze({
    s3: {
        region: S3_REGION,
        bucket: S3_BUCKET_NAME,
    },
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    accessKeyId: AWS_ACCESS_KEY_ID,
    defaultRegion: S3_REGION || 'eu-central-1',
})
