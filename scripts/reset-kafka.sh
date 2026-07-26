#!/usr/bin/env bash

set -e

echo "Stopping Kafka and deleting local volumes..."

docker compose down -v

echo "Starting Kafka..."

docker compose up -d

echo "Waiting for Kafka..."

sleep 10

./scripts/create-kafka-topics.sh

echo "Kafka environment reset completed."