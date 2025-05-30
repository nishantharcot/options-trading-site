import { createClient, RedisClientType } from "redis";
import { UserManager } from "./UserManager";
import { redisUrl } from "./config";

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private redisClient: RedisClientType;
  private subscriptions: Map<string, string[]> = new Map();
  private reverseSubscriptions: Map<string, string[]> = new Map();

  private constructor() {
    this.redisClient = createClient({ url: redisUrl });
    this.redisClient.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }

    return this.instance;
  }

  public subscribe(userId: string, subscription: string) {
    if (this.subscriptions.get(userId)?.includes(subscription)) {
      return;
    }

    this.subscriptions.set(
      userId,
      (this.subscriptions.get(userId) || []).concat(subscription)
    );
    this.reverseSubscriptions.set(
      subscription,
      (this.reverseSubscriptions.get(subscription) || []).concat(userId)
    );

    if (this.reverseSubscriptions.get(subscription)?.length === 1) {
      this.redisClient.subscribe(subscription, this.redisCallbackhandler);
    }
  }

  private redisCallbackhandler = (message: any, channel: string) => {
    this.reverseSubscriptions
      .get(channel)
      ?.forEach((s) => UserManager.getInstance().getUser(s)?.emit(message));
  };

  public unsubscribe(userId: string, subscription: string) {
    const subscriptions = this.subscriptions.get(userId);

    if (subscriptions) {
      this.subscriptions.set(
        userId,
        subscriptions.filter((s) => s !== subscription)
      );
    }

    const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
    if (reverseSubscriptions) {
      this.reverseSubscriptions.set(
        userId,
        reverseSubscriptions.filter((s) => s !== userId)
      );

      if (this.reverseSubscriptions.get(userId)?.length === 0) {
        this.reverseSubscriptions.delete(subscription);
        this.redisClient.unsubscribe(subscription);
      }
    }
  }

  public userLeft(userId: string) {
    this.subscriptions.get(userId)?.forEach((s) => this.unsubscribe(userId, s));
  }

  getSubscriptions(userId: string) {
    return this.subscriptions.get(userId) || [];
  }
}
