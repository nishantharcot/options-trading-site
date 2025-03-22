import express from "express";
import { RedisManager } from "../RedisManager";

export const createSymbol = async (
  req: express.Request,
  res: express.Response
) => {
  const { stockSymbol } = req.params;
  const {endTime} = req.body;

  console.log("body check:- ", req.body)

  console.log('endTime check:- ', endTime)

  const response = await RedisManager.getInstance().sendAndAwait({
    type: "CREATE_SYMBOL",
    data: {
      stockSymbol,
      endTime
    },
  });

  res.json(response.payload);
};
