// NOTE A provider can be imported like this
import { S3Provider } from '@providers/s3'

const s3Provider = new S3Provider()
s3Provider.presignedUrl('/mypic.png').then(console.log).catch(console.log)
