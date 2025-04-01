// import { OrderBook, StockBalance, UserBalance, OrderQueues } from "../types/data";
import mongoose from "mongoose";
import { InrBalancesModel } from "../schema/inrbalances";
import { OrderBookModel } from "../schema/orderbook";
import { StockBalancesModel } from "../schema/stockbalances";
import { StockEndTimeModel } from "../schema/stockendtimes";
import { OrderQueuesModel } from "../schema/orderqueues";
import { deserializeOrderBook, deserializeOrderQueues, deserializeStockBalances, deserializeStockEndTimes, deserializeUserBalances } from "../utils";
import dotenv from "dotenv";
dotenv.config();

export type UserBalance = {
  balance: number;
  locked: number;
};

export type StockBalance = {
  yes?: {
    quantity: number;
    locked: number;
  };
  no?: {
    quantity: number;
    locked: number;
  };
};

export type OrderDetails = {
  total: number;
  orders: Map<string, number>;
};

export type OrderPrice = {
  [price: string]: OrderDetails;
};

export type OrderType = {
  yes?: OrderPrice;
  no?: OrderPrice;
};

export type OrderBook = Map<string, OrderType>;

export type OrderRequest = {
  userId: string;
  stockSymbol: string;
  quantity: number;
  price: number;
  stockType: StockType;
};

export type StockType = "yes" | "no";

export type BuyOrderDetails = {
  userId: string;
  quantity: number;
  price: number;
  stockType: StockType;
  timestamp: Date;
}

export type OrderQueues = {
  BUY_ORDER_QUEUE: Map<string, BuyOrderDetails[]>;
  SELL_ORDER_QUEUE: Map<string, BuyOrderDetails[]>;
};


export const INR_BALANCES: Map<string, UserBalance> = new Map();
export const ORDERBOOK: OrderBook = new Map();
export const STOCK_BALANCES: Map<string, Map<string, StockBalance>> = new Map();
export const STOCK_END_TIMES: Map<string, Date> = new Map();

export const ORDER_QUEUES: OrderQueues = {
  BUY_ORDER_QUEUE: new Map(),
  SELL_ORDER_QUEUE: new Map(),
};

export async function initData() {

  await mongoose.connect(process.env.MONGO_URL || "");

  console.log("connected to DB");

  try {
    const [inrBalancesData, orderBookData, stockBalancesData, stockEndTimesData, orderQueuesData] =
      await Promise.all([
        InrBalancesModel.find().lean(),
        OrderBookModel.find().lean(),
        StockBalancesModel.find().lean(),
        StockEndTimeModel.find().lean(),
        OrderQueuesModel.find().lean()
      ]);

    if (inrBalancesData) {
      INR_BALANCES.clear();
      const deserializedBalances = deserializeUserBalances((inrBalancesData));
      deserializedBalances.forEach((value, key) => INR_BALANCES.set(key, value));

    }

    if (orderBookData) {
      ORDERBOOK.clear();
      const deserializedOrderBook = deserializeOrderBook((orderBookData));
      deserializedOrderBook.forEach((value, key) => ORDERBOOK.set(key, value));
    }

    if (stockBalancesData) {
      STOCK_BALANCES.clear();
      const deserializedStockBalances = deserializeStockBalances((stockBalancesData));
      deserializedStockBalances.forEach((value, key) => STOCK_BALANCES.set(key, value));
    }

    if (stockEndTimesData) {
      STOCK_END_TIMES.clear();
      const deserializedStockEndTimes = deserializeStockEndTimes(stockEndTimesData);
      deserializedStockEndTimes.forEach((value, key) => STOCK_END_TIMES.set(key, value));

    }

    if (orderQueuesData) {
      ORDER_QUEUES.BUY_ORDER_QUEUE.clear();
      ORDER_QUEUES.SELL_ORDER_QUEUE.clear();
      const deserializedOrderQueues = deserializeOrderQueues(orderQueuesData);

      ORDER_QUEUES.BUY_ORDER_QUEUE = deserializedOrderQueues.BUY_ORDER_QUEUE;
      ORDER_QUEUES.SELL_ORDER_QUEUE = deserializedOrderQueues.SELL_ORDER_QUEUE;

    }

    console.log("Data initialized successfully.");
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}