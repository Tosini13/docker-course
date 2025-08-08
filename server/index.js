const keys = require("./keys");
 
// Express App Setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
 
const app = express();
app.use(cors());
app.use(bodyParser.json());
 
// Postgres Client Setup
const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});
 
pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));
});
 
// Redis Client Setup
const redis = require("redis");

const redisClient = redis.createClient({
  url: `redis://${keys.redisHost}:${keys.redisPort}`,
});
const redisPublisher = redisClient.duplicate();
 
redisClient.on('error', (err) => {
  console.error('Error connecting to Redis!', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis!');
});

// Express route handlers
 
app.get("/", (req, res) => {
  res.send(JSON.stringify({response: "Hi from server"}));
});

(async () => {
  try {
    await redisClient.connect();
    await redisPublisher.connect();

    app.get("/values/current", async (req, res) => {
      try {
        const values = await redisClient.hGetAll("values");
        res.send(values);
      } catch (err) {
        console.error('Error getting values from Redis', err);
        res.status(500).send({ error: 'Redis error' });
      }
    });
  } catch (err) {
    console.error('Error connecting to Redis', err);
  }
})();
 
 
app.get("/values/all", async (req, res) => {
  try {
    const values = await pgClient.query("SELECT * from values");
    res.send(values.rows);
  } catch (err) {
    console.error('Error getting values from Postgres', err);
  }
});
 
 
 
app.get("/values/current-api", async (req, res) => {
  try {
    const values = await redisClient.hGetAll("values");
    res.send(values);
  } catch (err) {
    console.error('Error getting values from Redis', err);
  }
});


app.post("/values-api", async (req, res) => {
  const index = req.body.index;
 
  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }
  try {
    pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
  } catch (err) {
    console.error('Error inserting value into Postgres', err);
  }
 
  res.send({ working: true });
});

app.post("/values", async (req, res) => {
  const index = req.body.index;
 
  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }
  try {
    await redisClient.hSet("values", index, "Nothing yet!");
    await redisPublisher.publish("insert", index);
    pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
  } catch (err) {
    console.error('Error inserting value into Redis or Postgres', err);
  }
 
  res.send({ working: true });
});
 
app.listen(5000, (err) => {
  console.log("Listening");
});