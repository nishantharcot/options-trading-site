import { OrderBook, StockBalance, UserBalance, OrderQueues } from "../types/data";

export const INR_BALANCES: Map<string, UserBalance> = new Map();
export const ORDERBOOK: OrderBook = new Map();
export const STOCK_BALANCES: Map<string, Map<string, StockBalance>> = new Map();
export const STOCK_END_TIMES: Map<string, Date> = new Map();

export const ORDER_QUEUES: OrderQueues = {
  BUY_ORDER_QUEUE: new Map(),
  SELL_ORDER_QUEUE: new Map(),
};
