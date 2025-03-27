import express from "express"
import { createClient } from "redis"
import cors from "cors"
import userRouter from "./routes/userRoutes";
import symbolRouter from "./routes/symbolRoutes";
import getRouter from "./routes/getRoutes";
import stockRouter from "./routes/stockRoutes";

const app = express();


console.log('url check:- ', `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

app.use(cors({origin: '*'}))
app.use(express.json())

const routers = [
  { path: '', router: userRouter },
  { path: '', router: symbolRouter },
  { path: '', router: getRouter },
  {path: '/order', router: stockRouter}
];

routers.forEach(({ path, router }) => app.use(path, router));

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