import { STOCK_TYPE } from "../types/fromAPI";

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

type OrderDetails = {
  total: number;
  orders: Map<string, number>;
};

type OrderPrice = {
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
  stockType: STOCK_TYPE;
};

export const INR_BALANCES: Map<string, UserBalance> = new Map();
export const ORDERBOOK: OrderBook = new Map();
export const STOCK_BALANCES: Map<string, Map<string, StockBalance>> = new Map();
export const STOCK_END_TIMES: Map<string, Date> = new Map();

type StockType = "yes" | "no";

export type BuyOrderDetails = {
  userId: string;
  quantity: number;
  price: number;
  stockType: StockType;
  timestamp: Date;
}

export type ORDER_QUEUES = {
  BUY_ORDER_QUEUE: Map<string, BuyOrderDetails[]>;
  SELL_ORDER_QUEUE: Map<string, BuyOrderDetails[]>;
};

export const ORDER_QUEUES: ORDER_QUEUES = {
  BUY_ORDER_QUEUE: new Map(),
  SELL_ORDER_QUEUE: new Map(),
};
