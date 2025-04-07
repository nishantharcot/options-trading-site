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

const redisClient = createClient();

// app.use(cors({origin: '*'}))

app.use(cors({
  origin: "http://localhost:3001", // your frontend origin
  credentials: true,               // allow cookies
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
  console.log("token check:- ", token);
  if (!token) return res.status(401).json({ authenticated: false });

  try {
    const payload = jwt.verify(token, "randomyoyo");
    return res.json({ authenticated: true, user: payload });

  } catch {
    return res.status(401).json({ authenticated: false });
  }
});

async function startServer() {
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