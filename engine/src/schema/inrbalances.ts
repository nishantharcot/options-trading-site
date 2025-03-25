import { Schema, model } from "mongoose";

const InrBalanceSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, required: true, default: 0 },
  locked: { type: Number, required: true, default: 0 },
});

export const InrBalancesModel = model("InrBalances", InrBalanceSchema);