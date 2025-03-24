import { OrderType } from "./data";

export type OrderBookForEvent = {
  event: string;
  eventOrderbook: OrderType;
};
