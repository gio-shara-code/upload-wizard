setup: localstack-up terraform-init terraform-apply

stop: localstack-stop

reset:
	@echo "Resetting"
	@make localstack-reset
	@make terraform-apply

teardown: localstack-teardown

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

terraform-init:
	@echo "Initializing Terraform..."
	terraform init

terraform-apply:
	@echo "Applying Terraform..."
	terraform apply -auto-approve

s3-reset:
	@echo "Resetting S3..."
	aws --endpoint-url=http://localhost:4566 s3 rm s3://test-bucket/upload --recursive
