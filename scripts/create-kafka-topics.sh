#!/usr/bin/env bash

set -e

BOOTSTRAP_SERVER="localhost:9092"
KAFKA_CONTAINER="kafka"

create_topic() {
  local topic_name="$1"
  local partitions="$2"

  docker exec "$KAFKA_CONTAINER" \
    /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server "$BOOTSTRAP_SERVER" \
    --create \
    --if-not-exists \
    --topic "$topic_name" \
    --partitions "$partitions" \
    --replication-factor 1
}

create_topic "order.created" 3
create_topic "order.created.retry" 3
create_topic "order.created.dlq" 3
create_topic "order.status-changed" 3

echo "Kafka topics are ready."