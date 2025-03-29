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

getRouter.get("/api/orderbook", getOrderBook);
getRouter.get("/api/orderbook/:event", getOrderBookForEvent);
getRouter.get("/api/balances/inr", getInrBalances);
getRouter.get("/api/balances/inr/:userId", getUserBalance);
getRouter.get("/api/balances/stock", getStockBalances);
getRouter.get("/api/stockendtimes", getStockEndTimes);

export default getRouter;
