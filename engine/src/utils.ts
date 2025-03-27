import { OrderType, OrderBook, StockBalance, UserBalance, BuyOrderDetails, OrderQueues, OrderPrice } from "./types/data";

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

export function deserializeUserBalances(data: any[]): Map<string, UserBalance> {
  const inrBalances = new Map<string, UserBalance>();

  if (!Array.isArray(data)) return inrBalances; // Handle cases where data isn't an array

  data.forEach((item) => {
    if (item.userId && typeof item.balance === "number" && typeof item.locked === "number") {
      inrBalances.set(item.userId, { balance: item.balance, locked: item.locked });
    }
  });

  return inrBalances;
}

export function deserializeOrderBook(data: any): OrderBook {
  const orderBook = new Map<string, OrderType>();

  if (!Array.isArray(data)) {
    console.error("deserializeOrderBook: data is not an array", data);
    return orderBook;
  }

  data.forEach((entry) => {
    if (typeof entry !== "object" || entry === null) {
      console.error("deserializeOrderBook: Invalid entry format", entry);
      return;
    }

    const { eventId, orderBook: orderData } = entry;

    if (typeof eventId !== "string" || typeof orderData !== "object" || orderData === null) {
      console.error("deserializeOrderBook: Invalid eventId or orderData", { eventId, orderData });
      return;
    }

    const processOrderPrice = (orderPrice: any): OrderPrice | undefined => {
      if (typeof orderPrice !== "object" || orderPrice === null) return undefined;

      return Object.fromEntries(
        Object.entries(orderPrice).map(([price, orderDetails]) => {
          price = price.replace("_", ".");
          if (typeof orderDetails !== "object" || orderDetails === null) {
            console.error("deserializeOrderBook: Invalid orderDetails", { price, orderDetails });
            return [price, { total: 0, orders: new Map() }];
          }

          const details = orderDetails as { total: number; orders: Record<string, number> };
          return [
            price,
            {
              total: details.total,
              orders: new Map(Object.entries(details.orders)),
            },
          ];
        })
      );
    };

    orderBook.set(eventId, {
      yes: processOrderPrice(orderData.yes),
      no: processOrderPrice(orderData.no),
    });
  });

  return orderBook;
}

export function deserializeStockBalances(data: any[]): Map<string, Map<string, StockBalance>> {
  const stockBalances = new Map<string, Map<string, StockBalance>>();

  if (!Array.isArray(data)) return stockBalances;

  data.forEach(({ userId, stocks }) => {
    if (typeof userId === "string" && typeof stocks === "object") {
      const userStocks = new Map<string, StockBalance>();
      
      Object.entries(stocks).forEach(([stockSymbol, stockData]) => {
        const stockDetails = stockData as { yes?: { quantity: number; locked: number }; no?: { quantity: number; locked: number } };
        userStocks.set(stockSymbol, {
          yes: stockDetails.yes ? { quantity: stockDetails.yes.quantity, locked: stockDetails.yes.locked } : undefined,
          no: stockDetails.no ? { quantity: stockDetails.no.quantity, locked: stockDetails.no.locked } : undefined,
        });
      });
      
      stockBalances.set(userId, userStocks);
    }
  });

  return stockBalances;
}

export function deserializeStockEndTimes(data: any[]): Map<string, Date> {
  const stockEndTimes = new Map<string, Date>();

  if (!Array.isArray(data)) return stockEndTimes;

  data.forEach(({ stockId, endTime }) => {
    if (typeof stockId === "string" && endTime) {
      stockEndTimes.set(stockId, new Date(endTime));
    }
  });

  return stockEndTimes;
}

export function deserializeOrderQueues(data: any[]): OrderQueues {
  const orderQueues: OrderQueues = {
    BUY_ORDER_QUEUE: new Map<string, BuyOrderDetails[]>(),
    SELL_ORDER_QUEUE: new Map<string, BuyOrderDetails[]>(),
  };

  if (!Array.isArray(data)) return orderQueues;

  data.forEach(({ BUY_ORDER_QUEUE, SELL_ORDER_QUEUE }) => {
    if (BUY_ORDER_QUEUE && typeof BUY_ORDER_QUEUE === "object") {
      Object.entries(BUY_ORDER_QUEUE).forEach(([stockId, orders]) => {
        if (Array.isArray(orders)) {
          orderQueues.BUY_ORDER_QUEUE.set(
            stockId,
            orders.map(order => ({
              userId: order.userId,
              quantity: order.quantity,
              price: order.price,
              stockType: order.stockType,
              timestamp: new Date(order.timestamp),
            }))
          );
        }
      });
    }

    if (SELL_ORDER_QUEUE && typeof SELL_ORDER_QUEUE === "object") {
      Object.entries(SELL_ORDER_QUEUE).forEach(([stockId, orders]) => {
        if (Array.isArray(orders)) {
          orderQueues.SELL_ORDER_QUEUE.set(
            stockId,
            orders.map(order => ({
              userId: order.userId,
              quantity: order.quantity,
              price: order.price,
              stockType: order.stockType,
              timestamp: new Date(order.timestamp),
            }))
          );
        }
      });
    }
  });

  return orderQueues;
}
