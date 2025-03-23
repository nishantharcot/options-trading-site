import { WebSocket } from "ws";
import { IncomingMessage } from "./types";
import { SubscriptionManager } from "./SubscriptionManager";

export class User {
  private id: string;
  private ws: WebSocket;
  private subscriptions: string[] = [];

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.addListeners();
  }

  public subscribe(subscription: string) {
    this.subscriptions.push(subscription);
  }

  public unsubscribe(subscription: string) {
    this.subscriptions = this.subscriptions.filter((s) => s !== subscription);
  }

  emit(message: string) {
    this.ws.send(message);
  }

  private addListeners() {
    this.ws.on("message", (message) => {
      const parsedMessage: IncomingMessage = JSON.parse(message.toString());

      console.log('message check:- ', parsedMessage)

      if (parsedMessage.method === "SUBSCRIBE") {
        parsedMessage.params.forEach((s) =>
          SubscriptionManager.getInstance().subscribe(this.id, s)
        );
      }

      if (parsedMessage.method === "UNSUBSCRIBE") {
        parsedMessage.params.forEach((s) =>
          SubscriptionManager.getInstance().unsubscribe(this.id, s)
        );
      }
    });
  }
}
