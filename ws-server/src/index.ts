import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";

const wss = new WebSocketServer({ port: 8081 });

wss.on("connection", (ws) => {
  console.log("connection opened");
  UserManager.getInstance().addUser(ws);
});
