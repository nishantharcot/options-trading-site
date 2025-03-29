const API_URL = process.env.API_URL

export class MarketMaker {
  private eventList: string[];
  private possiblePrices: number[];
  private eventEndTimes: Map<string, Date>;
  private users: string[];
  private static instance: MarketMaker;

  private constructor() {
    this.eventList = [
      "Elon Musk to rank higher than Zuckerberg according to Forbes Billionaires List 2025?",
      "Will 2024 be recorded as the hottest year on record by NASA?",
      "Zomato's revenue to be ₹5400 crore or more for Q3 of FY25?"
    ];

    this.users = Array(100).fill('').map((_, index) => `mm${index}`)
    this.eventEndTimes = new Map();
    this.possiblePrices = [950, 900, 850, 800, 750, 700, 650];
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new MarketMaker();
    }

    return this.instance;
  }

  public createUsers() {
    const userCreate = async () => {
      console.log("API_URL:- ", API_URL);
      const userPromises = MarketMaker.getInstance().users.map(user => fetch(API_URL + `/user/create/${user}`, { method: "POST" }));
      const userJson = await Promise.all(userPromises);
      const userData = await Promise.all(userJson.map(data => data.json()));

      return userData;
    }

    return userCreate();
  }

  public addBalanceToAllUsers() {
    const temp = async () => {
      const onrampPromises = MarketMaker.getInstance().users.map(userId => {
        return fetch(API_URL + "/onramp/inr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount: 10000000,
            userId: userId
          })
        });
      })
      try {
        const onrampJson = await Promise.all(onrampPromises);
        const onrampData = await Promise.all(onrampJson.map(data => data.json()));
  
        return onrampData;
      } catch(e) {
        console.error(e);
        return ["Req Failed"];
      }
    }

    return temp();
  }

  public createEventAndMintTokens(event: string) {
    const newEvent = async () => {
      const deadline = new Date(Date.now() + 3*60*1000);

      const resJson = await fetch(API_URL + `/symbol/create/${encodeURIComponent(event)}`, { method: "POST", headers: {
        "Content-Type": "application/json"
      }, body: JSON.stringify({
        endTime: deadline
      }) });

      const resData = await resJson.json();
      MarketMaker.getInstance().eventEndTimes.set(event, deadline);
      
      const mintPromises = MarketMaker.getInstance().users.map(user => {
        return fetch(API_URL + "/trade/mint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            stockSymbol: encodeURIComponent(event),
            userId: user,
            quantity: 50,
            price: 1000,
          })
        })
      })

      const mintPromisesJson = await Promise.all(mintPromises);
      const mintPromisesData = await Promise.all(mintPromisesJson.map(data => data.json()));

      return mintPromisesData;
    }

    return newEvent();
  }

  public initializeEventsAndMintTokens() {

    const temp = async () => {
      // Initialize events
      let c = 2;
      const eventPromises = MarketMaker.getInstance().eventList.map(event => {
        const deadline = new Date(Date.now() + c*60*1000);
        c+=2;
        MarketMaker.getInstance().eventEndTimes.set(event, deadline);

        return fetch(API_URL + `/symbol/create/${encodeURIComponent(event)}`, { method: "POST", headers: {
          "Content-Type": "application/json"
        }, body: JSON.stringify({
          endTime: deadline
        }) });
      })

      const eventPromisesJson = await Promise.all(eventPromises);
      const eventPromisesData = await Promise.all(eventPromisesJson.map(data => data.json()));

      const mintPromises: any[] = [];
  
      MarketMaker.getInstance().eventList.map(event => {
        MarketMaker.getInstance().users.map(user => {
          const p = fetch(API_URL + "/trade/mint", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              stockSymbol: encodeURIComponent(event),
              userId: user,
              quantity: 250,
              price: 1000,
            })
          });
  
          mintPromises.push(p);
        })
      })
  
      const mintPromisesJson = await Promise.all(mintPromises);
      const mintPromisesData = await Promise.all(mintPromisesJson.map(data => data.json()))

      return mintPromisesData;
    }

    return temp();

  }

  public getRandomEvent() {
    return MarketMaker.getInstance().eventList[Math.floor(Math.random()*MarketMaker.getInstance().eventList.length)]
  }

  public getRandomUser() {
    return MarketMaker.getInstance().users[Math.floor(Math.random()*MarketMaker.getInstance().users.length)];
  }

  public getRandomPrice() {
    return MarketMaker.getInstance().possiblePrices[Math.floor(Math.random()*MarketMaker.getInstance().possiblePrices.length)];
  }

  public addBalanceToUser(user: string) {
    const temp = async () => {
      const resJson = await fetch(API_URL + "/onramp/inr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: 1000000,
          userId: user
        })
      })

      const resData = await resJson.json();

      return resData;
    }

    return temp();
  }

  public placeOrderRandomly() {
    console.log('placeOrderRandomly reached!!!');
    const event = MarketMaker.getInstance().getRandomEvent();

    if (Date.now() >= MarketMaker.getInstance().eventEndTimes.get(event)!.getTime()) {
      setTimeout(() => {
        MarketMaker.getInstance().createEventAndMintTokens(event);
      }, 1000)
      return;
    }

    const temp = async () => {
      console.log('temp placeOrderRandomly called!!!');
      const user = MarketMaker.getInstance().getRandomUser();
      const price = MarketMaker.getInstance().getRandomPrice();
      const quantity = 1 + Math.floor(Math.random()*10);

      console.log("temp temp temp!!!");

      console.log("url checking:- ", API_URL + "/order/sell");
  
      const res1Json = await fetch(API_URL + "/order/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockSymbol: encodeURIComponent(event),
          userId: user,
          quantity: quantity,
          price: price,
          stockType: "yes"
        }),
      })

      console.log("res1Json check:- ", res1Json);

      const res1Data = await res1Json.json();

      console.log("res1Data check:- ", res1Json);

      if (res1Data.message.payload === "Insufficient INR balance") {
        MarketMaker.getInstance().addBalanceToUser(user);
        return;
      }

      // Stock balance insufficient
  
      const res2Json = await fetch(API_URL + "/order/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockSymbol: encodeURIComponent(event),
          userId: user,
          quantity: quantity,
          price: 1000 - price,
          stockType: "no"
        }),
      })

      const res2Data = await res2Json.json();

      if (res2Data.message.payload === "Insufficient INR balance") {
        MarketMaker.getInstance().addBalanceToUser(user);
      }
    }
    
    return temp();
  }
};