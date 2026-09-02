const redis = require('redis');

const client = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'redis'}:6379`
});

client.on('error', (err) => console.log('Redis Client Error', err));

// Connect automatically (optional based on your design, connecting here for now to ensure it works)
client.connect().catch(console.error);

module.exports = client;
