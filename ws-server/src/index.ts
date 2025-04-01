import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";

const wss = new WebSocketServer({ host: "0.0.0.0", port: 8081 });

wss.on("connection", (ws) => {
  console.log("connection opened");
  UserManager.getInstance().addUser(ws);
});
