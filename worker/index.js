const keys = require('./keys');
const redis = require('redis');
 

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
}).on('error', (err) => {
  console.error('Error connecting to Redis!', err);
});
 
const sub = redisClient.duplicate();
 
function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}
 
(async () => {
  await redisClient.connect();
  await sub.connect();
 
  sub.subscribe('insert', (message) => {
    redisClient.hSet('values', message, fib(parseInt(message)));
  });
})();
