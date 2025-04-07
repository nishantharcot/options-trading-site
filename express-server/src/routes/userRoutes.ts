import express from "express";
import {
  createUser,
  resetData,
  onrampInr,
  mintTokens,
  signIn,
  signUp,
  signOut
} from "../controllers/userController";
import { verifyToken } from "../middlewares/auth";

const userRouter = express.Router();

userRouter.post("/api/user/create/:userId", createUser);
userRouter.post("/api/signin", signIn);
userRouter.post("/api/signup", signUp);
userRouter.post("/api/signout", signOut);
userRouter.post("/api/reset", resetData);
userRouter.post("/api/onramp/inr", verifyToken, onrampInr);
userRouter.post("/api/trade/mint", verifyToken, mintTokens);

export default userRouter;
