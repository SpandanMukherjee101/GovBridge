const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'application-service',
  brokers: [process.env.KAFKA_BROKERS || 'kafka:9092']
});

// Export the kafka instance, producers and consumers will be created elsewhere
module.exports = kafka;
