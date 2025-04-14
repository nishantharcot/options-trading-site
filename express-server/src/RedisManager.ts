import { RedisClientType, createClient } from "redis";
import { API_TO_ENGINE_ORDER_TYPES, ENGINE_TO_API_RESPONSE_TYPES } from "./types";
import uniqid from "uniqid";

export class RedisManager {
  private client: RedisClientType
  private publisher: RedisClientType
  private static instance: RedisManager

  private constructor() {
    this.client = process.env.NODE_ENV === "production"
      ? createClient({
          url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        })
      : createClient();
    this.client.connect();
    this.publisher = process.env.NODE_ENV === "production"
      ? createClient({
          url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        })
      : createClient();
    this.publisher.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }

    return this.instance;
  }

  public sendAndAwait(request: API_TO_ENGINE_ORDER_TYPES) {
    return new Promise<ENGINE_TO_API_RESPONSE_TYPES>((resolve) => {
      const id = this.getRandomId();

      this.client.subscribe(id, (message) => {
        this.client.unsubscribe(id);
        resolve(JSON.parse(message))
      })

      this.publisher.lPush("requests", JSON.stringify({clientID: id, request}))
    })
  }

  public getRandomId() {
    return uniqid()
  }
}