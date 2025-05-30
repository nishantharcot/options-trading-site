import express from "express";
import { RedisManager } from "../RedisManager";

export const createSymbol = async (
  req: express.Request,
  res: express.Response
) => {
  const { stockSymbol } = req.params;
  const {endTime} = req.body;

  decodeURIComponent(stockSymbol);

  const response = await RedisManager.getInstance().sendAndAwait({
    type: "CREATE_SYMBOL",
    data: {
      stockSymbol: decodeURIComponent(stockSymbol),
      endTime
    },
  });

  res.json(response.payload);
};
