const redis = require('redis');

let client = null;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Redis connection failed:', error);
    // Continue without Redis in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Running without Redis - sessions will be stored in memory');
      return null;
    }
    throw error;
  }
};

const getClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  return client;
};

module.exports = { connectRedis, getClient };