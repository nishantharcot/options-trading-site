import { RedisManager } from "../RedisManager.js";
import express from "express";
import { isProduction } from "../config.js";

export const createUser = async (
  req: express.Request,
  res: express.Response
) => {
  const { userId } = req.params;

  // console.log("userId check:- ", userId);

  const response = await RedisManager.getInstance().sendAndAwait({
    type: "CREATE_USER",
    data: {
      userId,
    },
  });

  res.json(response.payload);
};

export const signUp = async (
  req: express.Request,
  res: express.Response
) => {
  const { userId, password } = req.body;

  // console.log("userId check:- ", userId);

  const response = await RedisManager.getInstance().sendAndAwait({
    type: "SIGNUP",
    data: {
      userId,
      password
    },
  });


  // console.log("response check:- ", response);

  if (response.payload.token) {
    // console.log("yo man")
    res.cookie("authToken", response.payload.token, {
      httpOnly: isProduction,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
  }


  // console.log("payload check:- ", response.payload)

  res.json(response.payload);
};

export const signIn = async (
  req: express.Request,
  res: express.Response
) => {
  const { userId, password } = req.body;

  // console.log("userId check:- ", userId);

  const response = await RedisManager.getInstance().sendAndAwait({
    type: "SIGNIN",
    data: {
      userId,
      password
    },
  });

  if (response.payload.token) {
    // console.log("yo man")
    res.cookie("authToken", response.payload.token, {
      httpOnly: isProduction,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
  }

  res.json(response.payload);
};

export const signOut = async (
  req: express.Request,
  res: express.Response
) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ message: "Logged out successfully" });
};

export const resetData = async (
  req: express.Request,
  res: express.Response
) => {
  const response = await RedisManager.getInstance().sendAndAwait({
    type: "RESET_DATA",
  });

  res.json(response.payload);
};

export const onrampInr = async (
  req: express.Request,
  res: express.Response
) => {
  const { userId, amount } = req.body;

  const response = await RedisManager.getInstance().sendAndAwait({
    type: "ONRAMP_INR",
    data: {
      userId,
      amount,
    },
  });

  res.json(response.payload);
};

export const mintTokens = async (
  req: express.Request,
  res: express.Response
) => {
  const { userId, stockSymbol, quantity, price } = req.body;

  const response = await RedisManager.getInstance().sendAndAwait({
    type: "MINT",
    data: {
      userId,
      stockSymbol,
      quantity,
      price,
    },
  });

  res.json(response.payload);
};
