import express from "express";
import {
  createUser,
  resetData,
  onrampInr,
  mintTokens,
} from "../controllers/userController";

const userRouter = express.Router();

userRouter.post("/api/user/create/:userId", createUser);
userRouter.post("/api/reset", resetData);
userRouter.post("/api/onramp/inr", onrampInr);
userRouter.post("/api/trade/mint", mintTokens);

export default userRouter;
