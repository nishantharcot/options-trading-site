import { Router } from "express";
import { buyStock, sellStock } from "../controllers/stockController";

const stockRouter = Router();

stockRouter.post("/api/order/buy", buyStock);
stockRouter.post("/api/order/sell", sellStock);

export default stockRouter;
