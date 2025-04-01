function entriesToObject(entries: [string, any][]): { [key: string]: any } {
  const obj: { [key: string]: any } = {};
  entries.forEach(([key, value]) => {
    obj[key] = value;
  });
  return obj;
}

function getEntries(obj: { [key: string]: any }): [string, any][] {
  const entries: [string, any][] = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      entries.push([key, obj[key]]);
    }
  }
  return entries;
}

type OrderDetails = {
  total: number;
  orders: Map<string, number>;
};

type OrderPrice = {
  [price: string]: OrderDetails;
};

type OrderType = {
  yes?: OrderPrice;
  no?: OrderPrice;
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

export type UserBalance = {
  balance: number;
  locked: number;
};

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

export type OrderBook = Map<string, OrderType>;

export function deserializeOrderBook(json: string): OrderBook {
  const parsedArray = JSON.parse(json);
  return new Map(
    parsedArray.map(([key, orderType]: [key: string, orderType: OrderType]) => {
      return [
        key,
        {
          yes: orderType.yes
            ? entriesToObject(
                getEntries(orderType.yes).map(([price, orderDetails]) => [
                  price,
                  {
                    total: orderDetails.total,
                    orders: new Map(orderDetails.orders),
                  },
                ])
              )
            : undefined,
          no: orderType.no
            ? entriesToObject(
                getEntries(orderType.no).map(([price, orderDetails]) => [
                  price,
                  {
                    total: orderDetails.total,
                    orders: new Map(orderDetails.orders),
                  },
                ])
              )
            : undefined,
        },
      ];
    })
  );
}

export function orderBookToMongoose(orderBook: OrderBook) {
  const mongooseData = [];

  for (const [eventId, orderData] of orderBook.entries()) {
    mongooseData.push({
      eventId,
      orderBook: {
        yes: orderData.yes
          ? Object.fromEntries(
              Object.entries(orderData.yes).map(([price, details]) => [
                price.replace(/\./g, "_"), // ✅ Replace dots in price
                {
                  total: details.total,
                  orders: Object.fromEntries(
                    Array.from(details.orders.entries()).map(([key, value]) => [
                      key.replace(/\./g, "_"), // ✅ Replace dots in orders keys
                      value,
                    ])
                  ),
                },
              ])
            )
          : {},

        no: orderData.no
          ? Object.fromEntries(
              Object.entries(orderData.no).map(([price, details]) => [
                price.replace(/\./g, "_"), // ✅ Replace dots in price
                {
                  total: details.total,
                  orders: Object.fromEntries(
                    Array.from(details.orders.entries()).map(([key, value]) => [
                      key.replace(/\./g, "_"), // ✅ Replace dots in orders keys
                      value,
                    ])
                  ),
                },
              ])
            )
          : {},
      },
    });
  }

  return mongooseData;
}

export function deserializeInrBalances(data: string): Map<string, UserBalance> {
  const parsed = JSON.parse(data) as [string, UserBalance][];
  return new Map(parsed);
}

export function inrBalancesToMongoose(inrBalances: Map<string, UserBalance>) {
  return Array.from(inrBalances, ([userId, balanceData]) => ({
    userId,
    balance: balanceData.balance,
    locked: balanceData.locked,
  }));
}

export function deserializeStockBalances(serialized: string): Map<string, Map<string, StockBalance>> {
  const parsed: [string, [string, StockBalance][]][] = JSON.parse(serialized);
  return new Map(
    parsed.map(([userId, stocks]) => [
      userId,
      new Map(stocks.map(([stockId, balance]) => [stockId, balance])),
    ])
  );
}

export function stockBalancesToMongoose(stockBalances: Map<string, Map<string, StockBalance>>) {
  return Array.from(stockBalances, ([userId, stocks]) => ({
    userId,
    stocks: Object.fromEntries(stocks),
  }));
}

export function deserializeOrderQueues(data: string): ORDER_QUEUES {
  const parsed = JSON.parse(data);

  return {
    BUY_ORDER_QUEUE: new Map(
      parsed.BUY_ORDER_QUEUE.map(([stock, orders]: [string, any[]]) => [
        stock,
        orders.map(order => ({
          userId: order.userId,
          quantity: order.quantity,
          price: order.price,
          stockType: order.stockType,
          timestamp: new Date(order.timestamp),
        })),
      ])
    ),
    SELL_ORDER_QUEUE: new Map(
      parsed.SELL_ORDER_QUEUE.map(([stock, orders]: [string, any[]]) => [
        stock,
        orders.map(order => ({
          userId: order.userId,
          quantity: order.quantity,
          price: order.price,
          stockType: order.stockType,
          timestamp: new Date(order.timestamp),
        })),
      ])
    ),
  };
}

export function orderQueuesToMongoose(orderQueues: ORDER_QUEUES) {
  return {
    BUY_ORDER_QUEUE: Object.fromEntries(
      Array.from(orderQueues.BUY_ORDER_QUEUE, ([stock, orders]) => [
        stock,
        orders.map(order => ({
          userId: order.userId,
          quantity: order.quantity,
          price: order.price,
          stockType: order.stockType,
          timestamp: order.timestamp,
        })),
      ])
    ),
    SELL_ORDER_QUEUE: Object.fromEntries(
      Array.from(orderQueues.SELL_ORDER_QUEUE, ([stock, orders]) => [
        stock,
        orders.map(order => ({
          userId: order.userId,
          quantity: order.quantity,
          price: order.price,
          stockType: order.stockType,
          timestamp: order.timestamp,
        })),
      ])
    ),
  };
}

export function deserializeStockEndTimes(stockEndTimes: string): Map<string, Date> {
  return new Map<string, Date>(
    JSON.parse(stockEndTimes).map(([key, value]: [string, string]) => [key, new Date(value)])
  );
}

export function stockEndTimesToMongoose(stockEndTimes: Map<string, Date>) {
  return Array.from(stockEndTimes, ([stockId, endTime]) => ({
    stockId,
    endTime,
  }));
}
