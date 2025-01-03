import { STOCK_TYPE } from "../types/fromAPI";

type UserBalance = {
  balance: number;
  locked: number;
};

type StockBalance = {
  [key in "yes" | "no"]: {
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

type ORDER_QUEUES = {
  BUY_ORDER_QUEUE: OrderRequest[];
  SELL_ORDER_QUEUE: OrderRequest[];
};

export const ORDER_QUEUES: ORDER_QUEUES = {
  BUY_ORDER_QUEUE: [],
  SELL_ORDER_QUEUE: [],
};

export const BUY_ORDER_QUEUE: OrderRequest[] = [];
export const SELL_ORDER_QUEUE: OrderRequest[] = [];
