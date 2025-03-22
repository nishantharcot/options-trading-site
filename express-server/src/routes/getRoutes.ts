import { Router } from "express"
import {
  getInrBalances,
  getOrderBook,
  getStockBalances,
  getUserBalance,
  getOrderBookForEvent,
  getStockEndTimes
} from "../controllers/getRoutesController";

const getRouter = Router();

getRouter.get("/orderbook", getOrderBook);
getRouter.get("/orderbook/:event", getOrderBookForEvent);
getRouter.get("/balances/inr", getInrBalances);
getRouter.get("/balances/inr/:userId", getUserBalance);
getRouter.get("/balances/stock", getStockBalances);
getRouter.get("/stockendtimes", getStockEndTimes);

export default getRouter;
