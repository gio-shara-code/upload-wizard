resource "aws_s3_bucket" "s3-localstack" {
  bucket = "test-bucket"
}

resource "aws_s3_bucket_ownership_controls" "s3-owner-controls" {
  bucket = aws_s3_bucket.s3-localstack.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}
