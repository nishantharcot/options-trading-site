import express from "express";
import { RedisManager } from "../RedisManager";
import { STOCK_TYPE } from "../types";

export const buyStock = async (req: express.Request, res: express.Response) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  const response = await RedisManager.getInstance().sendAndAwait({
    type: "BUY",
    data: {
      userId,
      stockSymbol,
      quantity,
      price,
      stockType,
    },
  });

  res.json(response.payload);
};

export const sellStock = async (
  req: express.Request,
  res: express.Response
) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  const response = await RedisManager.getInstance().sendAndAwait({
    type: "SELL",
    data: {
      userId,
      stockSymbol,
      quantity,
      price,
      stockType,
    },
  });

  res.json(response.payload);
};
