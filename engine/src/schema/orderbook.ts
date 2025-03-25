import { Schema, model } from "mongoose";

const OrderDetailsSchema = new Schema({
  total: { type: Number, required: true },
  orders: { type: Map, of: Number },
});

const OrderPriceSchema = new Schema({
  yes: { type: Map, of: OrderDetailsSchema },
  no: { type: Map, of: OrderDetailsSchema },
});

const OrderBookSchema = new Schema({
  eventId: { type: String, required: true, unique: true },
  orderBook: OrderPriceSchema,
});

export const OrderBookModel = model("OrderBook", OrderBookSchema);