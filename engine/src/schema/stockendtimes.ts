import { Schema, model } from "mongoose";


const StockEndTimeSchema = new Schema({
  stockId: { type: String, required: true, unique: true },
  endTime: { type: Date, required: true },
});

export const StockEndTimeModel = model("StockEndTime", StockEndTimeSchema);
