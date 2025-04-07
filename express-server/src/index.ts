import express from "express"
import { createClient } from "redis"
import cors from "cors"
import userRouter from "./routes/userRoutes";
import symbolRouter from "./routes/symbolRoutes";
import getRouter from "./routes/getRoutes";
import stockRouter from "./routes/stockRoutes";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

app.use(cors({
  origin: "https://optixchanges.com",
  credentials: true,
}));



app.use(cookieParser());

app.use(express.json());

const routers = [
  { path: '', router: userRouter },
  { path: '', router: symbolRouter },
  { path: '', router: getRouter },
  {path: '', router: stockRouter}
];

routers.forEach(({ path, router }) => app.use(path, router));

app.get("/api/check-auth", (req: any, res: any) => {
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ authenticated: false });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    return res.json({ authenticated: true, user: payload });

  } catch {
    return res.status(401).json({ authenticated: false });
  }
});

console.log("Express server code reached!!!")

async function startServer() {
  console.log("Reaching here!!!")
  try {
    await redisClient.connect();

    app.listen(3000, () => {
      console.log('Server listening on port 3000')
    })

  } catch(e) {
    console.log('Error:- ', e)
  }
}

startServer()