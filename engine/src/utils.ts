import { OrderBook, OrderType, StockBalance, UserBalance } from "./data";
import { OrderRequest } from "./data";
import { BuyOrderDetails } from "./data";


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


export function sortSellOrderQueueByPrice(
  queue: BuyOrderDetails[]
): BuyOrderDetails[] {
  return queue.sort((a, b) => a.price - b.price);
}
