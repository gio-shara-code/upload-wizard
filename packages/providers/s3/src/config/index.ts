import { config } from 'dotenv'
config()
import { default as awsConfig } from './aws'

export default {
    aws: awsConfig,
}
