import { Router } from "express";
import { createSymbol } from "../controllers/symbolController";

const symbolRouter = Router();

symbolRouter.post("/api/symbol/create/:stockSymbol", createSymbol);

export default symbolRouter;
