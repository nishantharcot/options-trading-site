import { WebSocket } from "ws";
import { User } from "./User";
import { SubscriptionManager } from "./SubscriptionManager";

export class UserManager {
  private static instace: UserManager
  private users: Map<string, User> = new Map()

  public static getInstance() {
    if (!this.instace) {
      this.instace = new UserManager();
    }

    return this.instace
  }

  public addUser(ws: WebSocket) {
    const id = this.getRandomId();
    const user = new User(id, ws);
    this.users.set(id, user);
    this.registerOnClose(ws, id);
    return user;
  }

  private registerOnClose(ws: WebSocket, id: string) {
    console.log('register on close yo!!')
    ws.on('close', () => {
      this.users.delete(id)
      console.log('did it reach here???')
      SubscriptionManager.getInstance().userLeft(id)
    })
  }

  public getUser(id: string) {
    return this.users.get(id);
  }

  private getRandomId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
}
