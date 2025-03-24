import { Schema, model } from "mongoose";


const BuyOrderSchema = new Schema({
  userId: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  stockType: { type: String, required: true },
  timestamp: { type: Date, required: true },
});

const OrderQueuesSchema = new Schema({
  BUY_ORDER_QUEUE: {
    type: Map,
    of: [BuyOrderSchema],
    default: {},
  },
  SELL_ORDER_QUEUE: {
    type: Map,
    of: [BuyOrderSchema], // Same structure as BuyOrderSchema
    default: {},
  },
});

export const OrderQueuesModel = model("OrderQueues", OrderQueuesSchema);
