import mongoose from "mongoose";
import { createClient } from "redis";
import dotenv from "dotenv";
import {
  deserializeOrderBook,
  deserializeInrBalances,
  orderBookToMongoose,
  UserBalance,
  inrBalancesToMongoose,
  deserializeStockBalances,
  StockBalance,
  stockBalancesToMongoose,
  deserializeOrderQueues,
  ORDER_QUEUES,
  orderQueuesToMongoose,
  deserializeStockEndTimes,
  stockEndTimesToMongoose,
} from "./utils";
import { OrderBook } from "./utils";
import { OrderBookModel } from "./schema/orderbook";
import { InrBalancesModel } from "./schema/inrbalances";
import { StockBalancesModel } from "./schema/stockbalances";
import { OrderQueuesModel } from "./schema/orderqueues";
import { StockEndTimeModel } from "./schema/stockendtimes";
import fs from "fs";

dotenv.config();

const STATE = {
  ORDERBOOK: [] as any[],
  INR_BALANCES: [] as any[],
  STOCK_BALANCES: [] as any[],
  ORDER_QUEUES: {} as any,
  STOCK_END_TIMES: [] as any[],
};

async function saveOrderbookToDb() {
  await OrderBookModel.deleteMany({});

  await OrderBookModel.insertMany(STATE.ORDERBOOK);

  return "OrderBook replaced successfully!";
}

async function saveInrBalancesToDb() {
  await InrBalancesModel.deleteMany({});
  await InrBalancesModel.insertMany(STATE.INR_BALANCES);

  return "INR Balances replaced successfully";
}

async function saveStockBalancesToDb() {
  await StockBalancesModel.deleteMany({});
  await StockBalancesModel.insertMany(STATE.STOCK_BALANCES);

  return "Stock Balances replaced successfully";
}

async function saveOrderQueuesToDb() {
  await OrderQueuesModel.deleteMany({});
  await OrderQueuesModel.insertMany(STATE.ORDER_QUEUES);

  return "Order queues replaced successfully";
}

async function saveStockEndTimesToDb() {
  await StockEndTimeModel.deleteMany({});
  await StockEndTimeModel.insertMany(STATE.STOCK_END_TIMES);

  return "Stock endtimes replaced successfully";
}

async function saveToDb() {
  const promises = await Promise.all([
    saveOrderbookToDb(),
    saveInrBalancesToDb(),
    saveStockBalancesToDb(),
    saveOrderQueuesToDb(),
    saveStockEndTimesToDb(),
  ]);

  console.log(promises);
}

async function main() {
  try {
    const redisClient = createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });
    await redisClient.connect();
  
    await mongoose.connect(process.env.MONGO_URL || "");
  
    console.log("connected to DB");
  
    setInterval(saveToDb, 60*60*1000);
  
    while (true) {
      const responseOrderBook = await redisClient.brPop("db_server:orderbook", 0);
      const responseInrBalances = await redisClient.brPop(
        "db_server:inr_balances",
        0
      );
      const responseStockBalances = await redisClient.brPop(
        "db_server:stock_balances",
        0
      );
  
      const responseOrderQueues = await redisClient.brPop(
        "db_server:order_queues",
        0
      );
  
      const responseStockEndTimes = await redisClient.brPop(
        "db_server:stock_endtimes",
        0
      );
  
      if (responseOrderBook?.element) {
        fs.writeFile(
          "order_book_snapshot.json",
          responseOrderBook?.element,
          (err) => {
            if (err) console.error("Error writing snapshot:", err);
          }
        );
  
        const res = deserializeOrderBook(responseOrderBook.element);
  
        STATE.ORDERBOOK = orderBookToMongoose(res);
  
        // saveOrderbookToDb();
      }
  
      if (responseInrBalances?.element) {
        fs.writeFile(
          "inr_balances_snapshot.json",
          responseInrBalances.element,
          (err) => {
            if (err) console.error("Error writing snapshot:", err);
          }
        );
  
        const res = deserializeInrBalances(responseInrBalances.element);
  
        STATE.INR_BALANCES = inrBalancesToMongoose(res);
      }
  
      if (responseStockBalances?.element) {
        fs.writeFile(
          "stock_balances_snapshot.json",
          responseStockBalances.element,
          (err) => {
            if (err) console.error("Error writing snapshot:", err);
          }
        );
  
        const res = deserializeStockBalances(responseStockBalances.element);
  
        STATE.STOCK_BALANCES = stockBalancesToMongoose(res);
  
        // saveStockBalancesToDb();
      }
  
      if (responseOrderQueues?.element) {
        fs.writeFile(
          "order_queues_snapshot.json",
          responseOrderQueues.element,
          (err) => {
            if (err) console.error("Error writing snapshot:", err);
          }
        );
  
        const res = deserializeOrderQueues(responseOrderQueues.element);
  
        STATE.ORDER_QUEUES = orderQueuesToMongoose(res);
  
        // saveOrderQueuesToDb();
      }
  
      if (responseStockEndTimes?.element) {
        fs.writeFile(
          "stock_endtimes_snapshot.json",
          responseStockEndTimes.element,
          (err) => {
            if (err) console.error("Error writing snapshot:", err);
          }
        );
  
        const res = deserializeStockEndTimes(responseStockEndTimes.element);
  
        STATE.STOCK_END_TIMES = stockEndTimesToMongoose(res);
  
        // saveStockEndTimesToDb();
      }
    }
  } catch(e) {
    console.log('error:- ', e);
  }
}

main();
