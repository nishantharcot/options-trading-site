import { createClient, RedisClientType } from "redis";
import { MessageToApi } from "./types/toApi";
import { OrderBookForEvent } from "./types/toWs";

export class RedisManager {
  private client: RedisClientType;
  private static instance: RedisManager;

  private constructor() {
    this.client = createClient();
    this.client.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }

    return this.instance;
  }

  public sendToApi(clientID: string, message: MessageToApi) {
    this.client.publish(clientID, JSON.stringify(message));
  }

  public publishMessage(event: string, message: OrderBookForEvent) {
    console.log('publishMessage');
    console.log('event:- ', event);
    console.log('message:- ', message);

    this.client.publish(event, JSON.stringify(message));
  }
}
