import { Router } from "express";
import { buyStock, sellStock } from "../controllers/stockController";

const stockRouter = Router();

stockRouter.post("/api/buy", buyStock);
stockRouter.post("/api/sell", sellStock);

export default stockRouter;
