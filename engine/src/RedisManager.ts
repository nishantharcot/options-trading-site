import { createClient, RedisClientType } from "redis";
import { MessageToApi } from "./types/toApi";
import { OrderBookForEvent } from "./types/toWs";
import { redisUrl } from "./config";


export class RedisManager {
  private client: RedisClientType;
  private static instance: RedisManager;

  private constructor() {
    this.client = createClient({ url: redisUrl });
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
    this.client.publish(event, JSON.stringify(message));
  }
}
