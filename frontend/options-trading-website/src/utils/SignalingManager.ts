/* eslint-disable @typescript-eslint/no-explicit-any */


export class SignalingManager {
  private static instance: SignalingManager;
  private ws: WebSocket;
  private id: number;
  private bufferedMessages: any[];
  private initialized: boolean = false;
  private callbacks: any = {};

  private constructor() {
    this.ws = new WebSocket("wss://optixchanges.com/ws");
    this.id = 1;
    this.bufferedMessages = [];
    this.init();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SignalingManager();
    }
    return this.instance;
  }

  init() {
    this.ws.onopen = () => {
      this.initialized = true;
      this.bufferedMessages.forEach((message) => {
        this.ws.send(JSON.stringify(message));
      });
      this.bufferedMessages = [];
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (this.callbacks[message.event]) {
        this.callbacks[message.event].forEach(({ callback }: {callback: any}) => {
          console.log("message check:- ", message);
          const newOrderbook = message.eventOrderbook;
          callback(newOrderbook);
        });
      }
    };
  }

  sendMessage(message: any) {
    const messageToSend = {
      id: this.id++,
      ...message,
    };

    if (!this.initialized) {
      this.bufferedMessages.push(messageToSend);
      return;
    }
    this.ws.send(JSON.stringify(messageToSend));
  }

  async registerCallback(event: string, callback: any) {

    console.log('registerCallback:- ', event);

    this.callbacks[event] = this.callbacks[event] || [];
    this.callbacks[event].push({ callback, event });
  }

  async deRegisterCallback(event: string) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].findIndex(
        (ele: any) => ele.event === event
      );
      if (index !== -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }
}
