import mongoose from "mongoose";
import { createClient } from "redis";
import dotenv from 'dotenv';
dotenv.config()

mongoose.connect(
  process.env.MONGO_URL || ""
);

async function main() {
  const redisClient = createClient();
  await redisClient.connect();

  while (true) {
    const response = await redisClient.brPop("db_server", 0)

    console.log('res check from archiver:- ', response)
  }
}


main();
