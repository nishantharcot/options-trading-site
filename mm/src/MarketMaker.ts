const API_URL = process.env.API_URL

import crypto from "crypto";
import fs from "fs";

export class MarketMaker {
  private eventList: string[];
  private possiblePrices: number[];
  private eventEndTimes: Map<string, Date>;
  private users: string[];
  private tokens: Map<string, string>;
  private passwords: Map<string, string>;
  private static instance: MarketMaker;

  public getPasswords() {
    let myMap: Map<string, string> = new Map();

    try {
      const data = fs.readFileSync("passwords.json", "utf8");

      let obj: any = JSON.parse(data); // convert JSON string to object

      obj = obj.map((data: any, index: any) => {
        return data[1];
      });

      obj.map((data: any, index: any) => {
        myMap.set(data[0], data[1]);
        MarketMaker.getInstance().passwords.set(data[0], data[1]);
      });
      return 1;
    } catch (e) {
      MarketMaker.getInstance().users.map((user) => {
        const password = MarketMaker.getInstance().generatePassword();
        MarketMaker.getInstance().passwords.set(user, password);
      });

      fs.writeFileSync(
        "passwords.json",
        JSON.stringify(Object.entries([...MarketMaker.getInstance().passwords]))
      );

      return -1;
    }
  }

  private constructor() {
    this.eventList = [
      "Elon Musk to rank higher than Zuckerberg according to Forbes Billionaires List 2025?",
      "Will 2024 be recorded as the hottest year on record by NASA?",
      "Zomato's revenue to be ₹5400 crore or more for Q3 of FY25?",
    ];

    this.users = Array(100)
      .fill("")
      .map((_, index) => `mm${index}`);
    this.eventEndTimes = new Map();
    this.passwords = new Map();
    this.tokens = new Map();
    this.possiblePrices = [950, 900, 850, 800, 750, 700, 650];
  }

  public generatePassword(length = 12) {
    return crypto.randomBytes(length).toString("base64").slice(0, length);
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new MarketMaker();
    }

    return this.instance;
  }

  public createUsers() {
    const userCreate = async () => {
      // SignUp users
      const res = MarketMaker.getInstance().getPasswords();

      const userPromises = MarketMaker.getInstance().users.map((user) => {
        let password = MarketMaker.getInstance().passwords.get(user);

        return fetch(API_URL + `/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user, password: password }),
        });
      });
      const userJson = await Promise.all(userPromises);
      const userData = await Promise.all(userJson.map((data) => data.json()));

      MarketMaker.getInstance().users.forEach((user, i) => {
        MarketMaker.getInstance().tokens.set(user, userData[i]);
      });

      console.log("userData check:- ", userData[0]);

      // SignOut users
      const userPromises2 = MarketMaker.getInstance().users.map((user) =>
        fetch(API_URL + `/signout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${MarketMaker.getInstance().tokens.get(
              user
            )}`,
          },
        })
      );
      const userJson2 = await Promise.all(userPromises2);
      const userData2 = await Promise.all(userJson2.map((data) => data.json()));

      console.log("userData2: ", userData2[0]);

      // SignIn users
      const userPromises3 = MarketMaker.getInstance().users.map((user) => {
        const password = MarketMaker.getInstance().passwords.get(user);
        return fetch(API_URL + `/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user, password: password }),
        });
      });

      const userJson3 = await Promise.all(userPromises3);
      const userData3 = await Promise.all(userJson3.map((data) => data.json()));

      MarketMaker.getInstance().users.map((user, index) => {
        MarketMaker.getInstance().tokens.set(user, userData3[index].token);
      });

      console.log("userData3: ", userData3[0]);
    };

    return userCreate();
  }

  public addBalanceToAllUsers() {
    const temp = async () => {

      const currentBalancesPromises = MarketMaker.getInstance().users.map((userId) => {
        return fetch(API_URL + `/balances/inr/${userId}`);
      });

      const currentBalancesJson = await Promise.all(currentBalancesPromises);
      const currentBalancesData = await Promise.all(currentBalancesJson.map(data => data.json()));

      console.log("currentBalancesData:- ", currentBalancesData);

      const onrampPromises = MarketMaker.getInstance().users.map((userId, index) => {
        const token = MarketMaker.getInstance().tokens.get(userId);
        if (Number(currentBalancesData[index].message) < 1000000) {
          return fetch(API_URL + "/onramp/inr", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              amount: 1000000,
              userId: userId,
            }),
          });
        } else {
          return;
        }
      });
      try {
        const onrampJson = await Promise.all(onrampPromises);
        const onrampData = await Promise.all(
          onrampJson.map((data) => {
            if (data) {
              return data.json();
            }
          })
        );

        console.log("onrampData:- ", onrampData);

        return onrampData;
      } catch (e) {
        console.log("error at addBalanceToAllUsers");
        console.error(e);
        return ["Req Failed"];
      }
    };

    return temp();
  }

  public createEventAndMintTokens(event: string) {
    const newEvent = async () => {

      const res = await MarketMaker.getInstance().addBalanceToAllUsers();
      console.log("addBalanceToAllUsers:- ", res[0]);

      const deadline = new Date(Date.now() + 3 * 60 * 1000);

      const resJson = await fetch(
        API_URL + `/symbol/create/${encodeURIComponent(event)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endTime: deadline,
          }),
        }
      );

      const resData = await resJson.json();
      MarketMaker.getInstance().eventEndTimes.set(event, deadline);

      const mintPromises = MarketMaker.getInstance().users.map((user) => {
        const token = MarketMaker.getInstance().tokens.get(user);

        return fetch(API_URL + "/trade/mint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            stockSymbol: encodeURIComponent(event),
            userId: user,
            quantity: 250,
            price: 1000,
          }),
        });
      });

      const mintPromisesJson = await Promise.all(mintPromises);
      const mintPromisesData = await Promise.all(
        mintPromisesJson.map((data) => data.json())
      );

      console.log("mintPromisesData:- ", mintPromisesData[0]);
      return mintPromisesData;
    };

    return newEvent();
  }

  public initializeEventsAndMintTokens() {
    const temp = async () => {
      // Initialize events
      let c = 2;
      const eventPromises = MarketMaker.getInstance().eventList.map((event) => {
        const deadline = new Date(Date.now() + c * 60 * 1000);
        c += 2;
        MarketMaker.getInstance().eventEndTimes.set(event, deadline);

        return fetch(API_URL + `/symbol/create/${encodeURIComponent(event)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endTime: deadline,
          }),
        });
      });
      try {
        const eventPromisesJson = await Promise.all(eventPromises);
        const eventPromisesData = await Promise.all(
          eventPromisesJson.map((data) => data.json())
        );
      } catch (e) {
        console.log("eventPromises failed!!");
      }

      const mintPromises: any[] = [];

      MarketMaker.getInstance().eventList.map((event) => {
        MarketMaker.getInstance().users.map((user) => {
          const token = MarketMaker.getInstance().tokens.get(user);

          const p = fetch(API_URL + "/trade/mint", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              stockSymbol: encodeURIComponent(event),
              userId: user,
              quantity: 250,
              price: 1000,
            }),
          });

          mintPromises.push(p);
        });
      });
      try {
        const mintPromisesJson = await Promise.all(mintPromises);
        const mintPromisesData = await Promise.all(
          mintPromisesJson.map((data) => data.json())
        );
        console.log("mintPromisesData:- ", mintPromisesData);
      } catch (e) {
        console.log("mintPromisesJson failed!!");
      }

      return 1;
    };

    return temp();
  }

  public getRandomEvent() {
    return MarketMaker.getInstance().eventList[
      Math.floor(Math.random() * MarketMaker.getInstance().eventList.length)
    ];
  }

  public getRandomUser() {
    return MarketMaker.getInstance().users[
      Math.floor(Math.random() * MarketMaker.getInstance().users.length)
    ];
  }

  public getRandomPrice() {
    return MarketMaker.getInstance().possiblePrices[
      Math.floor(
        Math.random() * MarketMaker.getInstance().possiblePrices.length
      )
    ];
  }

  public addBalanceToUser(user: string) {
    const temp = async () => {
      const token = MarketMaker.getInstance().tokens.get(user);
      const resJson = await fetch(API_URL + "/onramp/inr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: 1000000,
          userId: user,
        }),
      });

      const resData = await resJson.json();

      return resData;
    };

    return temp();
  }

  public placeOrderRandomly() {
    const event = MarketMaker.getInstance().getRandomEvent();

    if (
      Date.now() >=
      MarketMaker.getInstance().eventEndTimes.get(event)!.getTime()
    ) {
      setTimeout(() => {
        MarketMaker.getInstance().createEventAndMintTokens(event);
      }, 1000);
      return;
    }

    const temp = async () => {
      const user = MarketMaker.getInstance().getRandomUser();
      const price = MarketMaker.getInstance().getRandomPrice();
      const quantity = 1 + Math.floor(Math.random() * 10);

      const token = MarketMaker.getInstance().tokens.get(user);

      const res1Json = await fetch(API_URL + "/order/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stockSymbol: encodeURIComponent(event),
          userId: user,
          quantity: quantity,
          price: price,
          stockType: "yes",
        }),
      });

      const res1Data = await res1Json.json();

      console.log("res1Data:- ", res1Data);

      if (res1Data.message.payload === "Insufficient INR balance") {
        console.log("Recharging!");
        MarketMaker.getInstance().addBalanceToUser(user);
        return;
      }

      // Stock balance insufficient

      const res2Json = await fetch(API_URL + "/order/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stockSymbol: encodeURIComponent(event),
          userId: user,
          quantity: quantity,
          price: 1000 - price,
          stockType: "no",
        }),
      });

      const res2Data = await res2Json.json();

      console.log("res2Data:- ", res2Data);

      if (res2Data.message.payload === "Insufficient INR balance") {
        console.log("Recharging!");
        MarketMaker.getInstance().addBalanceToUser(user);
      }
    };

    return temp();
  }
}
