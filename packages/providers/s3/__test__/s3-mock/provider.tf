provider "aws" {
  access_key = "test"
  secret_key = "test"
  region     = "eu-central-1"

  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  s3_use_path_style           = true

  endpoints {
    s3 = "http://s3.localhost.localstack.cloud:4566"
  }
}
