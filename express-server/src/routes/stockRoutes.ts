import { Router } from "express";
import { buyStock, sellStock } from "../controllers/stockController";

const stockRouter = Router();

stockRouter.post("/buy", buyStock);
stockRouter.post("/sell", sellStock);

export default stockRouter;
