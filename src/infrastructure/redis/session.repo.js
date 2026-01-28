const redisClient = require('../../config/redis');

const EXPIRATION_TIME = 24 * 60 * 60; // 24 hours

// Fallback in-memory storage
const memoryStore = new Map();

// Generic key-based session
exports.getSession = async (key) => {
  if (redisClient.isReady) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Redis get error, falling back to memory:', err.message);
    }
  }
  // Fallback
  return memoryStore.get(key) || null;
};

exports.setSession = async (key, data) => {
  if (redisClient.isReady) {
    try {
      await redisClient.set(key, JSON.stringify(data), {
        EX: EXPIRATION_TIME,
      });
      return;
    } catch (err) {
       console.error('Redis set error, falling back to memory:', err.message);
    }
  }
  // Fallback
  memoryStore.set(key, data);
};

exports.deleteSession = async (key) => {
  if (redisClient.isReady) {
    try {
      await redisClient.del(key);
      return;
    } catch (err) {
        console.error('Redis del error, fallback memory:', err.message);
    }
  }
  // Fallback
  memoryStore.delete(key);
};
