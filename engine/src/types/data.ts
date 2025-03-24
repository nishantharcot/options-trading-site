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