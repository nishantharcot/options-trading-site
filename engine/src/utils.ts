import { OrderType, OrderBook, StockBalance, UserBalance, BuyOrderDetails, OrderQueues } from "./types/data";


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

export function serializeOrderBook(orderBook: OrderBook): string {
  return JSON.stringify(
    Array.from(orderBook, ([key, orderType]) => [
      key,
      {
        yes: orderType.yes
          ? entriesToObject(
              getEntries(orderType.yes).map(([price, orderDetails]) => [
                price,
                {
                  total: orderDetails.total,
                  orders: Array.from(orderDetails.orders),
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
                  orders: Array.from(orderDetails.orders),
                },
              ])
            )
          : undefined,
      },
    ])
  );
}

export function serializeOrderBookForEvent(orderType: OrderType): string {
  return JSON.stringify(
    Array.from([
      {
        yes: orderType.yes
          ? entriesToObject(
              getEntries(orderType.yes).map(([price, orderDetails]) => [
                price,
                {
                  total: orderDetails.total,
                  orders: Array.from(orderDetails.orders),
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
                  orders: Array.from(orderDetails.orders),
                },
              ])
            )
          : undefined,
      },
    ])
  );
}

export function serializeUserBalances(inrBalances: Map<string, UserBalance>): string {
  return JSON.stringify(Array.from(inrBalances.entries()));
}

export function serializeStockBalances(stockBalances: Map<string, Map<string, StockBalance>>): string {
  return JSON.stringify(
    Array.from(stockBalances, ([userId, stocks]) => [
      userId,
      Array.from(stocks, ([stockId, balance]) => [
        stockId,
        {
          yes: balance.yes ? { ...balance.yes } : undefined,
          no: balance.no ? { ...balance.no } : undefined,
        },
      ]),
    ])
  );
}

export function serializeOrderQueues(orderQueues: OrderQueues): string {
  return JSON.stringify({
    BUY_ORDER_QUEUE: Array.from(orderQueues.BUY_ORDER_QUEUE, ([stock, orders]) => [
      stock,
      orders.map(order => ({
        userId: order.userId,
        quantity: order.quantity,
        price: order.price,
        stockType: order.stockType,
        timestamp: order.timestamp.toISOString(),
      })),
    ]),
    SELL_ORDER_QUEUE: Array.from(orderQueues.SELL_ORDER_QUEUE, ([stock, orders]) => [
      stock,
      orders.map(order => ({
        userId: order.userId,
        quantity: order.quantity,
        price: order.price,
        stockType: order.stockType,
        timestamp: order.timestamp.toISOString(),
      })),
    ]),
  });
}

export function serializeStockEndTimes(stockEndTimes: Map<string, Date>): string {
  return JSON.stringify(Array.from(stockEndTimes.entries()));
}

export function sortSellOrderQueueByPrice(
  queue: BuyOrderDetails[]
): BuyOrderDetails[] {
  return queue.sort((a, b) => a.price - b.price);
}

export function deserializeUserBalances(serializedData: string): Map<string, UserBalance> {
  return new Map(
    JSON.parse(serializedData).map(([userId, balance]: [string, UserBalance]) => [
      userId,
      { balance: balance.balance, locked: balance.locked },
    ])
  );
}

export function deserializeStockBalances(serializedData: string): Map<string, Map<string, StockBalance>> {
  return new Map(
    JSON.parse(serializedData).map(([userId, stocks]: [string, [string, StockBalance][]]) => [
      userId,
      new Map(
        stocks.map(([stockId, balance]) => [
          stockId,
          {
            yes: balance.yes ? { quantity: balance.yes.quantity, locked: balance.yes.locked } : undefined,
            no: balance.no ? { quantity: balance.no.quantity, locked: balance.no.locked } : undefined,
          },
        ])
      ),
    ])
  );
}

export function deserializeOrderQueues(serializedData: string): OrderQueues {
  const parsedData = JSON.parse(serializedData);
  return {
    BUY_ORDER_QUEUE: new Map(
      parsedData.BUY_ORDER_QUEUE.map(([stock, orders]: [string, BuyOrderDetails[]]) => [
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
      parsedData.SELL_ORDER_QUEUE.map(([stock, orders]: [string, BuyOrderDetails[]]) => [
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

export function deserializeStockEndTimes(serializedData: string): Map<string, Date> {
  return new Map(
    JSON.parse(serializedData).map(([stock, timestamp]: [string, string]) => [stock, new Date(timestamp)])
  );
}

export function deserializeOrderBook(serializedData: string): OrderBook {
  return new Map(
    JSON.parse(serializedData).map(([key, orderType]: [string, any]) => [
      key,
      {
        yes: orderType.yes
          ? Object.fromEntries(
              Object.entries(orderType.yes).map(([price, orderDetails]: [string, any]) => [
                price,
                {
                  total: orderDetails.total,
                  orders: new Map(orderDetails.orders),
                },
              ])
            )
          : undefined,
        no: orderType.no
          ? Object.fromEntries(
              Object.entries(orderType.no).map(([price, orderDetails]: [string, any]) => [
                price,
                {
                  total: orderDetails.total,
                  orders: new Map(orderDetails.orders),
                },
              ])
            )
          : undefined,
      },
    ])
  );
}
