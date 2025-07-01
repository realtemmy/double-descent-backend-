const redis = require("redis");

// const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient({
  //   url: `redis://localhost:${REDIS_PORT}`,
  url: process.env.REDIS_URL,
});

client.on("error", (err) => console.log("Redis Client Error: ", err));

(async () => {
  await client.connect();
  console.log("Connected to Redis");
})();

module.exports = client;
