import { Router } from "express"
import {
  getInrBalances,
  getOrderBook,
  getStockBalances,
  getUserBalance,
  getOrderBookForEvent,
} from "../controllers/getRoutesController";

const getRouter = Router();

getRouter.get("/orderbook", getOrderBook);
getRouter.get("/orderbook/:event", getOrderBookForEvent);
getRouter.get("/balances/inr", getInrBalances);
getRouter.get("/balances/inr/:userId", getUserBalance);
getRouter.get("/balances/stock", getStockBalances);

export default getRouter;
