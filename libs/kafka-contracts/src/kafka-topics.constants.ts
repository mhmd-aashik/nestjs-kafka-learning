export const KafkaTopics = {
  ORDER_CREATED: 'order.created',

  ORDER_CREATED_RETRY: 'order.created.retry',

  ORDER_CREATED_DLQ: 'order.created.dlq',

  ORDER_STATUS_CHANGED: 'order.status-changed',
} as const;

export type KafkaTopic = (typeof KafkaTopics)[keyof typeof KafkaTopics];
