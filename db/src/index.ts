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
} from "./utils";
import { OrderBook } from "./utils";
import { OrderBookModel } from "./schema/orderbook";
import { InrBalancesModel } from "./schema/inrbalances";
import { StockBalancesModel } from "./schema/stockbalances";
dotenv.config();

let Orderbookflag = 1;
let InrBalancesflag = 1;

async function saveOrderbookToDb(orderbook: OrderBook) {
  if (Orderbookflag == 0) {
    return;
  }

  if (Orderbookflag == 1) {
    Orderbookflag = 0;
  }

  const res = orderBookToMongoose(orderbook);

  await OrderBookModel.deleteMany({});

  await OrderBookModel.insertMany(res);

  console.log("OrderBook replaced successfully!");
}

async function saveInrBalancesToDb(inr_balances: Map<string, UserBalance>) {
  if (InrBalancesflag == 0) {
    return;
  }

  if (InrBalancesflag == 1) {
    InrBalancesflag = 0;
  }

  const res = inrBalancesToMongoose(inr_balances);

  await InrBalancesModel.deleteMany({});
  await InrBalancesModel.insertMany(res);

  console.log("INR Balances replaced successfully");
}

let stockBalancesFlag = 1;
async function saveStockBalancesToDb(
  stock_balances: Map<string, Map<string, StockBalance>>
) {
  if (stockBalancesFlag == 0) {
    return;
  }

  if (stockBalancesFlag == 1) {
    stockBalancesFlag = 0;
  }

  const res = stockBalancesToMongoose(stock_balances);

  console.log("res check:- ", res);

  await StockBalancesModel.deleteMany({});
  await StockBalancesModel.insertMany(res);

  console.log("Stock Balances replaced successfully");
}

async function main() {
  const redisClient = createClient();
  await redisClient.connect();

  console.log("process.env.MONGO_URL:- ", process.env.MONGO_URL);

  await mongoose.connect(process.env.MONGO_URL || "");

  console.log("connected to DB");

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

    if (responseOrderBook?.element) {
      const res = deserializeOrderBook(responseOrderBook.element);

      // console.log('res check:- ', res);

      saveOrderbookToDb(res);
    }

    if (responseInrBalances?.element) {
      const res = deserializeInrBalances(responseInrBalances.element);

      saveInrBalancesToDb(res);
    }

    if (responseStockBalances?.element) {
      const res = deserializeStockBalances(responseStockBalances.element);

      saveStockBalancesToDb(res);
    }
  }
}

main();
