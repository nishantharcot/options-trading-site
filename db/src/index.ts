import mongoose from "mongoose";
import { createClient } from "redis";
import {
  deserializeOrderBook,
  deserializeInrBalances,
  orderBookToMongoose,
  inrBalancesToMongoose,
  deserializeStockBalances,
  stockBalancesToMongoose,
  deserializeOrderQueues,
  orderQueuesToMongoose,
  deserializeStockEndTimes,
  stockEndTimesToMongoose,
} from "./utils";
import { OrderBookModel } from "./schema/orderbook";
import { InrBalancesModel } from "./schema/inrbalances";
import { StockBalancesModel } from "./schema/stockbalances";
import { OrderQueuesModel } from "./schema/orderqueues";
import { StockEndTimeModel } from "./schema/stockendtimes";
import fs from "fs";
import { redisUrl, filePath } from "./config";

const redisClient = createClient({ url: redisUrl });
const pubClient = createClient({ url: redisUrl });
const subClient = createClient({ url: redisUrl });

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

  pubClient.publish("archiver:ack", "sync-complete");
}

async function loadStateFromSnapshots() {
  console.log("Loading snapshots from local file system...");

  try {
    // Load Order Book
    if (fs.existsSync(filePath + "order_book_snapshot.json")) {
      const raw = fs.readFileSync(
        filePath + "order_book_snapshot.json",
        "utf-8"
      );

      console.log("raw check:- ", raw);

      const deserialized = deserializeOrderBook(raw);
      STATE.ORDERBOOK = orderBookToMongoose(deserialized);
      console.log("Loaded order book snapshot.");
    }

    // Load INR Balances
    if (fs.existsSync(filePath + "inr_balances_snapshot.json")) {
      const raw = fs.readFileSync(
        filePath + "inr_balances_snapshot.json",
        "utf-8"
      );
      const deserialized = deserializeInrBalances(raw);
      STATE.INR_BALANCES = inrBalancesToMongoose(deserialized);
      console.log("Loaded INR balances snapshot.");
    }

    // Load Stock Balances
    if (fs.existsSync(filePath + "stock_balances_snapshot.json")) {
      const raw = fs.readFileSync(
        filePath + "stock_balances_snapshot.json",
        "utf-8"
      );
      const deserialized = deserializeStockBalances(raw);
      STATE.STOCK_BALANCES = stockBalancesToMongoose(deserialized);
      console.log("Loaded stock balances snapshot.");
    }

    // Load Order Queues
    if (fs.existsSync(filePath + "order_queues_snapshot.json")) {
      const raw = fs.readFileSync(
        filePath + "order_queues_snapshot.json",
        "utf-8"
      );
      const deserialized = deserializeOrderQueues(raw);
      STATE.ORDER_QUEUES = orderQueuesToMongoose(deserialized);
      console.log("Loaded order queues snapshot.");
    }

    // Load Stock End Times
    if (fs.existsSync(filePath + "stock_endtimes_snapshot.json")) {
      const raw = fs.readFileSync(
        filePath + "stock_endtimes_snapshot.json",
        "utf-8"
      );
      const deserialized = deserializeStockEndTimes(raw);
      STATE.STOCK_END_TIMES = stockEndTimesToMongoose(deserialized);
      console.log("Loaded stock endtimes snapshot.");
    }
  } catch (e) {
    console.error("error: ", e);
  }
}

async function main() {
  try {
    await redisClient.connect();
    await pubClient.connect();
    await subClient.connect();

    await mongoose.connect(process.env.MONGO_URL!);

    console.log("connected to DB");

    await loadStateFromSnapshots();

    await subClient.subscribe("sync:db", async (message) => {
      const data = JSON.parse(message);
      if (data.type === "engine-restart") {
        console.log("Engine restarted. Forcing immediate DB sync...");
        await saveToDb();
      }
    });

    setInterval(saveToDb, 10 * 60 * 1000);

    while (true) {
      const response = await redisClient.brPop(
        [
          "db_server:orderbook",
          "db_server:inr_balances",
          "db_server:stock_balances",
          "db_server:order_queues",
          "db_server:stock_endtimes",
        ],
        0
      );

      if (!response?.element) continue;

      const { key, element } = response;

      switch (key) {
        case "db_server:orderbook":
          fs.writeFile(
            filePath + "order_book_snapshot.json",
            element,
            (err) => {
              if (err) console.error("Error writing order book snapshot:", err);
            }
          );
          STATE.ORDERBOOK = orderBookToMongoose(deserializeOrderBook(element));
          break;

        case "db_server:inr_balances":
          fs.writeFile(
            filePath + "inr_balances_snapshot.json",
            element,
            (err) => {
              if (err)
                console.error("Error writing INR balances snapshot:", err);
            }
          );
          STATE.INR_BALANCES = inrBalancesToMongoose(
            deserializeInrBalances(element)
          );
          break;

        case "db_server:stock_balances":
          fs.writeFile(
            filePath + "stock_balances_snapshot.json",
            element,
            (err) => {
              if (err)
                console.error("Error writing stock balances snapshot:", err);
            }
          );
          STATE.STOCK_BALANCES = stockBalancesToMongoose(
            deserializeStockBalances(element)
          );
          break;

        case "db_server:order_queues":
          fs.writeFile(
            filePath + "order_queues_snapshot.json",
            element,
            (err) => {
              if (err)
                console.error("Error writing order queues snapshot:", err);
            }
          );
          STATE.ORDER_QUEUES = orderQueuesToMongoose(
            deserializeOrderQueues(element)
          );
          break;

        case "db_server:stock_endtimes":
          fs.writeFile(
            filePath + "stock_endtimes_snapshot.json",
            element,
            (err) => {
              if (err)
                console.error("Error writing stock endtimes snapshot:", err);
            }
          );
          STATE.STOCK_END_TIMES = stockEndTimesToMongoose(
            deserializeStockEndTimes(element)
          );
          break;

        default:
          console.warn("Unhandled key:", key);
          break;
      }
    }
  } catch (e) {
    console.log("error:- ", e);
  }
}

main();
