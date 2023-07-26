AWS_PROFILE=localstack_test_profile

setup: aws-profile-setup localstack-up s3-create

reset: teardown setup
reset-soft: s3-reset

teardown: localstack-teardown
teardown-soft: s3-delete localstack-stop

localstack-status:
	@echo "Checking localstack status..."
	@docker compose ps -a

localstack-teardown:
	@echo "Tearing down localstack..."
	@docker compose down -v

localstack-pause:
	@echo "Pausing localstack..."
	@docker compose pause

localstack-stop:
	@echo "Stopping localstack..."
	@docker compose stop

localstack-up:
	@echo "Starting localstack..."
	@docker inspect -f '{{.State.Status}}' s3-mock-localstack | grep 'paused' > /dev/null && \
 		docker compose unpause || \
 		docker compose up -d

aws-profile-setup:
	@echo "Setting AWS profile..."
	@aws configure --profile $AWS_PROFILE set aws_access_key_id test
	@aws configure --profile $AWS_PROFILE set aws_secret_access_key test
	@aws configure --profile $AWS_PROFILE set region eu-central-1

s3-delete:
	@echo "Deleting S3 Bucket..."
	@aws --endpoint-url=http://localhost:4566 \
 		--profile=$AWS_PROFILE \
 		s3api delete-bucket \
 		--bucket test-bucket

s3-exists:
	@echo "Checking if S3 Bucket exists..."
	@aws --endpoint-url=http://localhost:4566 \
		--profile=$AWS_PROFILE \
		s3api head-bucket \
		--bucket test-bucket

s3-create:
	@echo "Creating S3 Bucket..."
	@make s3-exists > /dev/null && echo "Bucket Already exists" && make s3-delete || echo "Bucket does not exist"

	@aws --endpoint-url=http://localhost:4566 \
				--profile=$AWS_PROFILE \
				s3api create-bucket \
				--bucket test-bucket \
				--object-ownership BucketOwnerEnforced \
				--create-bucket-configuration LocationConstraint=eu-central-1

	@echo "S3 Bucket created"


s3-reset:
	@echo "Resetting S3..."
	@aws --endpoint-url=http://localhost:4566 \
		--profile=$AWS_PROFILE \
		s3 rm s3://test-bucket/upload --recursive
