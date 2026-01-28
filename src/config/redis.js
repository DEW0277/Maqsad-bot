const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => {
    // Suppress connection refused logs to keep console clean if intentionally offline
    if (err.code === 'ECONNREFUSED') return; 
    console.log('Redis Client Error', err.message);
});

client.on('connect', () => console.log('✅ Redis Client Connected'));

(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.log('⚠️ Redis ga ulanib bo‘lmadi. In-Memory (vaqtinchalik xotira) rejimi ishga tushdi.');
  }
})();

module.exports = client;
