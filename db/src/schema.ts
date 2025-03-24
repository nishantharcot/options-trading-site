import { Schema, model } from "mongoose";

// Define the schema for OrderDetails
const OrderDetailsSchema = new Schema({
  total: { type: Number, required: true },
  orders: { type: Map, of: Number }, // Store as a Map of userId -> quantity
});

// Define the schema for OrderPrice (stores multiple price levels)
const OrderPriceSchema = new Schema({
  yes: { type: Map, of: OrderDetailsSchema },
  no: { type: Map, of: OrderDetailsSchema },
});

// Define the main OrderBook schema
const OrderBookSchema = new Schema({
  eventId: { type: String, required: true, unique: true }, // Event ID as unique key
  orderBook: OrderPriceSchema, // Storing Yes/No order data
});

// Create the Mongoose model
const OrderBookModel = model("OrderBook", OrderBookSchema);

export default OrderBookModel;
