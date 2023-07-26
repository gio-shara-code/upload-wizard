setup: localstack-up s3-create

reset: localstack-teardown setup
reset-soft: s3-reset

teardown: localstack-teardown
teardown-soft: s3-delete localstack-stop

localstack-status:
	@echo "Checking localstack status..."
	docker compose ps -a

localstack-teardown:
	@echo "Stopping localstack..."
	docker compose down -v

localstack-stop:
	@echo "Stopping localstack..."
	docker compose stop

localstack-reset:
	@echo "Resetting localstack..."
	@make localstack-teardown
	@make localstack-up

localstack-up:
	@echo "Starting localstack..."
	docker compose up -d

s3-delete:
	@echo "Deleting S3 Bucket..."
	@aws --endpoint-url=http://localhost:4566 \
 		--profile=localstack \
 		s3api delete-bucket \
 		--bucket test-bucket

s3-exists:
	@echo "Checking if S3 Bucket exists..."
	@aws --endpoint-url=http://localhost:4566 \
		--profile=localstack \
		s3api head-bucket \
		--bucket test-bucket

s3-create:
	@echo "Creating S3 Bucket..."
	@make s3-exists > /dev/null && echo "Bucket Already exists" && make s3-delete || echo "Bucket does not exist"

	@aws --endpoint-url=http://localhost:4566 \
				--profile=localstack \
				s3api create-bucket \
				--bucket test-bucket \
				--object-ownership BucketOwnerEnforced \
				--create-bucket-configuration LocationConstraint=eu-central-1

	@echo "S3 Bucket created"


s3-reset:
	@echo "Resetting S3..."
	@aws --endpoint-url=http://localhost:4566 \
		--profile=localstack \
		s3 rm s3://test-bucket/upload --recursive
