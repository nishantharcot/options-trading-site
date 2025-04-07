import { Router } from "express";
import { buyStock, sellStock } from "../controllers/stockController";
import { verifyToken } from "../middlewares/auth";

const stockRouter = Router();

stockRouter.post("/api/order/buy", verifyToken, buyStock);
stockRouter.post("/api/order/sell", verifyToken, sellStock);

export default stockRouter;
