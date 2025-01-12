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

export type OrderBookForEvent = {
  event: string;
  eventOrderbook: OrderType;
};
