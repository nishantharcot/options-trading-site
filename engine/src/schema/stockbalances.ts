import { Schema, model } from "mongoose";


const StockBalanceSchema = new Schema({
  yes: {
    quantity: { type: Number, required: false },
    locked: { type: Number, required: false },
  },
  no: {
    quantity: { type: Number, required: false },
    locked: { type: Number, required: false },
  },
});

const UserStockSchema = new Schema({
  userId: { type: String, required: true },
  stocks: { type: Map, of: StockBalanceSchema, required: true },
});

export const StockBalancesModel = model("StockBalances", UserStockSchema);
