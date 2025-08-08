const keys = require('./keys');
const redis = require('redis');
 
const redisClient = redis.createClient({
  url: `redis://${keys.redisHost}:${keys.redisPort}`,
});

redisClient.on('error', (err) => {
  console.error('Error connecting to Redis!', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis!');
});
 
const sub = redisClient.duplicate();
 
function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}
 
(async () => {
  await redisClient.connect();
  await sub.connect();

  console.log('redisClient.isReady', redisClient.isReady);
 
  sub.subscribe('insert', (message) => {
    redisClient.hSet('values', message, fib(parseInt(message)));
  });
})();
