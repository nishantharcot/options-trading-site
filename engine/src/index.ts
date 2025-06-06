import { createClient } from "redis";
import {
  ORDERBOOK,
  INR_BALANCES,
  STOCK_BALANCES,
  STOCK_END_TIMES,
} from "./data";
import { MessageFromApi } from "./types/fromAPI";
import { RedisManager } from "./RedisManager";
import {
  serializeOrderBook,
  serializeOrderBookForEvent,
  serializeOrderQueues,
  serializeStockBalances,
  serializeStockEndTimes,
  serializeUserBalances,
} from "./utils";
import { sortSellOrderQueueByPrice } from "./utils";
import { ORDER_QUEUES } from "./data";
import { initData } from "./data";
import { User } from "./schema/users";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { redisUrl } from "./config";

const redisClient = createClient({ url: redisUrl });
const pubsubClient = createClient({ url: redisUrl });

const marketMakerUsers: Map<string, number> = new Map();

for (let i = 0; i < 100; i++) {
  const user = `mm${i}`;

  marketMakerUsers.set(user, 1);
}

async function publishEvents({ stockSymbol }: { stockSymbol: string }) {
  if (ORDERBOOK.has(stockSymbol)) {
    RedisManager.getInstance().publishMessage(stockSymbol, {
      event: stockSymbol,
      eventOrderbook: ORDERBOOK.get(stockSymbol)!,
    });
  } else {
    RedisManager.getInstance().publishMessage(stockSymbol, {
      event: stockSymbol,
      eventOrderbook: {},
    });
  }
}

async function processSubmission({
  request,
  clientID,
}: {
  request: MessageFromApi;
  clientID: string;
}) {
  switch (request.type) {
    case "CREATE_USER":
      try {
        const { userId } = request.data;
        if (!INR_BALANCES.has(userId)) {
          INR_BALANCES.set(userId, { balance: 0, locked: 0 });
          STOCK_BALANCES.set(userId, new Map());

          for (const [key, order] of ORDERBOOK) {
            const res = STOCK_BALANCES.get(userId);
            if (res) {
              res.set(key, {
                yes: { quantity: 0, locked: 0 },
                no: { quantity: 0, locked: 0 },
              });
            }
          }

          RedisManager.getInstance().sendToApi(clientID, {
            type: "USER_CREATED",
            payload: {
              message: "User created successfully!",
            },
          });
        } else {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "USER_CREATED",
            payload: {
              message: "User already exists",
            },
          });
        }
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "REQUEST_FAILED",
          payload: {
            message: "Could not create user",
          },
        });
      }
      break;
    case "SIGNUP":
      try {
        const { userId, password } = request.data;

        // console.log("user Id:- ", userId);
        // console.log("password:- ", password);

        const userExists = await User.findOne({ userId });

        // console.log("userExists:- ", userExists);
      
        if (userExists) {
          if (!INR_BALANCES.has(userId)) {
            INR_BALANCES.set(userId, { balance: 0, locked: 0 });
            STOCK_BALANCES.set(userId, new Map());
  
            for (const [key, order] of ORDERBOOK) {
              const res = STOCK_BALANCES.get(userId);
              if (res) {
                res.set(key, {
                  yes: { quantity: 0, locked: 0 },
                  no: { quantity: 0, locked: 0 },
                });
              }
            }
          }

          RedisManager.getInstance().sendToApi(clientID, {
            type: "REQUEST_FAILED",
            payload: {
              message: "User already exists",
            },
          });
          break;
        }

        const user = new User({ userId, password });
        await user.save();


        // console.log("token check:- ", process.env.JWT_SECRET);

        // console.log("process.env.JWT_SECRET:- ", process.env.JWT_SECRET);

        // Generate JWT token
        const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!);

        if (!INR_BALANCES.has(userId)) {
          INR_BALANCES.set(userId, { balance: 0, locked: 0 });
          STOCK_BALANCES.set(userId, new Map());

          for (const [key, order] of ORDERBOOK) {
            const res = STOCK_BALANCES.get(userId);
            if (res) {
              res.set(key, {
                yes: { quantity: 0, locked: 0 },
                no: { quantity: 0, locked: 0 },
              });
            }
          }
        }

        // console.log("INR_BALANCES user check:- ", INR_BALANCES.get(userId));

        RedisManager.getInstance().sendToApi(clientID, {
          type: "SIGNUP_SUCCESSFUL",
          payload: {
            token: token,
            message: "User Sign up successfull!",
          },
        });
        
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "REQUEST_FAILED",
          payload: {
            message: "Could not create user",
          },
        });
      }
      break;
    case "SIGNIN":
        try {
          const { userId, password } = request.data;
          // console.log("userId:- ", userId);
          // console.log("password:- ", password);
          // Step 1: Find user by userId
          const user = await User.findOne({ userId });

          // console.log("user:- ", user);

          // console.log("my password:- ", password);
          // console.log("db password:- ", user?.password);
      
          if (!user || !user.password) {
            RedisManager.getInstance().sendToApi(clientID, {
              type: "REQUEST_FAILED",
              payload: {
                message: "Invalid credentials",
              },
            });
            break;
          }

          // console.log("step 1 passed!")
      
          // Step 2: Compare password
          const isMatch = await bcrypt.compare(password, user.password);
          // console.log("isMatch:- ", isMatch);
          if (!isMatch) {
            RedisManager.getInstance().sendToApi(clientID, {
              type: "REQUEST_FAILED",
              payload: {
                message: "Incorrect Password",
              },
            });
            break;
          }

          // console.log("step 2 passed!")
      
          // Step 3: Generate JWT
          const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!);

          // console.log("step 3 passed!")
      
          RedisManager.getInstance().sendToApi(clientID, {
            type: "LOGIN_SUCCESSFUL",
            payload: {
              token: token,
              message: "User logged in successfully!",
            },
          });
        } catch (err) {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "REQUEST_FAILED",
            payload: {
              message: "Could not create user",
            },
          });
        }
        break;
    case "CREATE_SYMBOL":
      try {
        const { stockSymbol, endTime } = request.data;
        STOCK_BALANCES.forEach((userMap, userKey) => {
          userMap.set(stockSymbol, {
            yes: { quantity: 0, locked: 0 },
            no: { quantity: 0, locked: 0 },
          });
        });
        STOCK_END_TIMES.set(stockSymbol, endTime);
        RedisManager.getInstance().sendToApi(clientID, {
          type: "SYMBOL_CREATED",
          payload: {
            message: "Symbol created successfully!",
          },
        });
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "REQUEST_FAILED",
          payload: {
            message: "Could not create symbol",
          },
        });
      }
      break;
    case "GET_ORDERBOOK":
      try {

        RedisManager.getInstance().sendToApi(clientID, {
          type: "GET_ORDERBOOK",
          payload: {
            message: serializeOrderBook(ORDERBOOK),
          },
        });
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "REQUEST_FAILED",
          payload: {
            message: "Failed to fetch ORDERBOOK",
          },
        });
      }
      break;
    case "GET_ORDERBOOK_FOR_EVENT":
      try {
        const { event } = request.data;

        const eventOrderbook = ORDERBOOK.get(event);

        if (!eventOrderbook) {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "GET_ORDERBOOK_FOR_EVENT",
            payload: {
              message: "Could not get orderbook for event",
            },
          });
        }

        RedisManager.getInstance().sendToApi(clientID, {
          type: "GET_ORDERBOOK",
          payload: {
            message: serializeOrderBookForEvent(eventOrderbook!),
          },
        });
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "REQUEST_FAILED",
          payload: {
            message: "Could not get orderbook for event",
          },
        });
      }
      break;
    case "GET_STOCK_BALANCES":
      try {
        const balancesObject: any = {};

        STOCK_BALANCES.forEach((balanceMap, balanceKey) => {
          const subObject: any = {};
          balanceMap.forEach((subMap, subKey) => {
            subObject[subKey] = subMap;
          });
          balancesObject[balanceKey] = subObject;
        });

        RedisManager.getInstance().sendToApi(clientID, {
          type: "GET_STOCK_BALANCES",
          payload: {
            message: JSON.stringify(balancesObject),
          },
        });
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "REQUEST_FAILED",
          payload: {
            message: "Failed to fetch STOCK_BALANCES",
          },
        });
      }
      break;
    case "GET_INR_BALANCES":
      try {
        const balancesObject: any = {};

        INR_BALANCES.forEach((balanceMap, balanceKey) => {
          balancesObject[balanceKey] = balanceMap;
        });

        RedisManager.getInstance().sendToApi(clientID, {
          type: "GET_INR_BALANCES",
          payload: {
            message: JSON.stringify(balancesObject),
          },
        });
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "REQUEST_FAILED",
          payload: {
            message: "Failed to fetch INR_BALANCES",
          },
        });
      }
      break;
    case "GET_STOCK_END_TIMES":
      try {
        const stockEndTimes: any = {};

        for (const [key, value] of STOCK_END_TIMES) {
          stockEndTimes[key] = value;
        }

        RedisManager.getInstance().sendToApi(clientID, {
          type: "GET_STOCK_END_TIMES",
          payload: {
            message: JSON.stringify(stockEndTimes),
          },
        });
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "REQUEST_FAILED",
          payload: {
            message: "Failed to fetch INR_BALANCES",
          },
        });
      }
      break;
    case "RESET_DATA":
      try {
        INR_BALANCES.clear();
        ORDERBOOK.clear();
        STOCK_BALANCES.clear();

        RedisManager.getInstance().sendToApi(clientID, {
          type: "RESET_DATA",
          payload: {
            message: "Reset successful",
          },
        });
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "RESET_DATA",
          payload: {
            message: "Reset Failed",
          },
        });
      }
      break;
    case "ONRAMP_INR":
      try {
        const { userId, amount } = request.data;

        if (INR_BALANCES.has(userId)) {
          const { balance, locked } = INR_BALANCES.get(userId)!;
          INR_BALANCES.set(userId, {
            balance: balance + amount,
            locked: locked,
          });
        } else {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "ONRAMP_INR",
            payload: {
              message: "User doesnt exist",
            },
          });
        }

        RedisManager.getInstance().sendToApi(clientID, {
          type: "ONRAMP_INR",
          payload: {
            message: "Onramp successful",
          },
        });
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "ONRAMP_INR",
          payload: {
            message: "Transaction Failed",
          },
        });
      }
      break;
    case "GET_USER_BALANCE":
      try {
        const { userId } = request.data;

        // console.log("userId:- ", userId);
        // console.log("INR_BALANCES.has(userId):- ", INR_BALANCES.has(userId));

        if (INR_BALANCES.has(userId)) {
          const { balance } = INR_BALANCES.get(userId)!;

          // console.log("balance check:- ", balance);

          RedisManager.getInstance().sendToApi(clientID, {
            type: "GET_USER_BALANCE",
            payload: {
              message: JSON.stringify(balance),
            },
          });
        } else {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "GET_USER_BALANCE",
            payload: {
              message: "User doesnt exist",
            },
          });
        }
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "GET_USER_BALANCE",
          payload: {
            message: "Unable to fetch data",
          },
        });
      }
      break;
    case "BUY":
      try {
        let { userId, stockSymbol, quantity, price, stockType } = request.data;

        stockSymbol = decodeURIComponent(stockSymbol);

        // STEP 1:- CHECK FOR SUFFICIENT BALANCE
        const stockCost = quantity * price;

        const userBalance = INR_BALANCES.get(userId)!;

        if (userBalance.balance < stockCost) {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "BUY",
            payload: {
              message: "Insufficient INR balance",
            },
          });
          break;
        }

        // STEP 2:- CHECK FOR STOCK IN ORDERBOOK
        const exists = ORDER_QUEUES.SELL_ORDER_QUEUE.has(stockSymbol);

        if (!exists) {
          // UPDATE ORDERBOOK AND INR_BALANCES

          const eventExists = ORDER_QUEUES.BUY_ORDER_QUEUE.has(stockSymbol);

          if (eventExists) {
            const res = ORDER_QUEUES.BUY_ORDER_QUEUE.get(stockSymbol);
            res?.push({
              userId: userId,
              quantity: quantity,
              price: price,
              stockType: stockType,
              timestamp: new Date(Date.now()),
            });
          } else {
            ORDER_QUEUES.BUY_ORDER_QUEUE.set(stockSymbol, [
              {
                userId: userId,
                quantity: quantity,
                price: price,
                stockType: stockType,
                timestamp: new Date(Date.now()),
              },
            ]);
          }

          INR_BALANCES.get(userId)!.balance -= stockCost;
          INR_BALANCES.get(userId)!.locked += stockCost;

          RedisManager.getInstance().sendToApi(clientID, {
            type: "BUY",
            payload: {
              message: "Buy order placed and pending",
            },
          });
          publishEvents({ stockSymbol: stockSymbol });
          break;
        }

        // STEP 3:- ITERATE ORDER_QUEUES.SELL_ORDER_QUEUE AND FULFILL THE ORDERS
        const indexesToBeDeleted = new Map();
        const origQuantity = quantity;
        const res = ORDER_QUEUES.SELL_ORDER_QUEUE.get(stockSymbol);

        if (!res) {
          return;
        }

        for (let i = 0; i < res.length; i++) {
          let {
            userId: sellerUserId,
            quantity: sellerQuantity,
            price: sellerPrice,
            stockType: sellerStockType,
          } = res[i];

          if (sellerStockType !== stockType || sellerPrice > price) {
            continue;
          }

          let toBeExecuted = 0;

          if (sellerQuantity <= quantity) {
            indexesToBeDeleted.set(i, 1);
            toBeExecuted = sellerQuantity;
          } else {
            toBeExecuted = quantity;
          }

          // SELLER details update
          INR_BALANCES.get(sellerUserId)!.locked -= toBeExecuted * sellerPrice;
          INR_BALANCES.get(sellerUserId)!.balance += toBeExecuted * sellerPrice;

          STOCK_BALANCES.get(sellerUserId)!.get(stockSymbol)![
            stockType
          ]!.locked! -= toBeExecuted;

          const priceKey = (sellerPrice / 100).toString();

          ORDERBOOK.get(stockSymbol)![stockType]![priceKey].total -=
            toBeExecuted;

          const prevQuantity =
            ORDERBOOK.get(stockSymbol)![stockType]![priceKey].orders.get(
              sellerUserId
            )!;


          ORDERBOOK.get(stockSymbol)![stockType]![priceKey].orders.set(
            sellerUserId,
            prevQuantity - toBeExecuted
          );


          // BUYER details update
          INR_BALANCES.get(userId)!.balance -= toBeExecuted * sellerPrice;
          if (STOCK_BALANCES.has(userId)) {
            const userData = STOCK_BALANCES.get(userId)!;
            if (userData.has(stockSymbol)) {
              userData.get(stockSymbol)![stockType]!.quantity += toBeExecuted;
            } else {
              userData.set(stockSymbol, {
                yes: { quantity: 0, locked: 0 },
                no: { quantity: 0, locked: 0 },
              });
              userData.get(stockSymbol)![stockType]!.quantity += toBeExecuted;
            }
          } else {
            STOCK_BALANCES.set(userId, new Map());
            const userData = STOCK_BALANCES.get(userId)!;

            userData.set(stockSymbol, {
              yes: { quantity: 0, locked: 0 },
              no: { quantity: 0, locked: 0 },
            });
            userData.get(stockSymbol)![stockType]!.quantity += toBeExecuted;
          }

          quantity -= toBeExecuted;
          sellerQuantity -= toBeExecuted;

          if (sellerQuantity == 0) {
            indexesToBeDeleted.set(i, 1);
          } else {
            res[i] = {
              userId: sellerUserId,
              quantity: sellerQuantity,
              price: sellerPrice,
              stockType: sellerStockType,
              timestamp: new Date(Date.now()),
            };
          }

          if (quantity == 0) {
            break;
          }
        }

        // Delete elements in queue

        const latest = ORDER_QUEUES.SELL_ORDER_QUEUE.get(stockSymbol)?.filter(
          (item, index) => {
            if (indexesToBeDeleted.has(index)) {
              return false;
            } else {
              return true;
            }
          }
        );
        if (latest) {
          ORDER_QUEUES.SELL_ORDER_QUEUE.set(stockSymbol, latest);
        }

        if (quantity == 0) {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "BUY",
            payload: {
              message: "Buy order placed and trade executed",
            },
          });
        } else if (quantity == origQuantity) {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "BUY",
            payload: {
              message: "Buy order placed and pending",
            },
          });
        } else {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "BUY",
            payload: {
              message: `Buy order matched partially, ${quantity} remaining`,
            },
          });
        }
        publishEvents({ stockSymbol: stockSymbol });
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "BUY",
          payload: {
            message: "Request Failed",
          },
        });
      }
      break;
    case "SELL":
      try {
        let { userId, stockSymbol, quantity, price, stockType } = request.data;

        stockSymbol = decodeURIComponent(stockSymbol);

        const origQuantity = quantity;

        // STEP 1:- CHECK IF USER HAS SUFFICIENT STOCK BALANCE
        const stockExists = STOCK_BALANCES.get(userId)!.get(stockSymbol);
        if (!stockExists) {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "SELL",
            payload: {
              message: "Stock doesn't exist in your account",
            },
          });
          break;
        }

        const stockTypeExists = stockExists[stockType];
        if (!stockTypeExists) {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "SELL",
            payload: {
              message: `${stockType} Stock for ${stockSymbol} doesn't exist in your account`,
            },
          });
          break;
        }
        const stockQuantity = stockTypeExists.quantity;

        if (stockQuantity < quantity) {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "SELL",
            payload: {
              message: "Stock balance Insufficient",
            },
          });
          break;
        }

        if (!ORDER_QUEUES.BUY_ORDER_QUEUE.has(stockSymbol)) {
          if (quantity > 0) {
            const priceKey = (price / 100).toString();

            if (ORDERBOOK.has(stockSymbol)) {
              if (ORDERBOOK.get(stockSymbol)![stockType]) {
                if (ORDERBOOK.get(stockSymbol)![stockType]![priceKey]) {
                  ORDERBOOK.get(stockSymbol)![stockType]![priceKey].total +=
                    quantity;
                  if (
                    ORDERBOOK.get(stockSymbol)![stockType]![
                      priceKey
                    ].orders.has(userId)
                  ) {
                    const current =
                      ORDERBOOK.get(stockSymbol)![stockType]![
                        priceKey
                      ].orders.get(userId)!;
                    ORDERBOOK.get(stockSymbol)![stockType]![
                      priceKey
                    ].orders.set(userId, quantity + current);
                  } else {
                    ORDERBOOK.get(stockSymbol)![stockType]![
                      priceKey
                    ].orders.set(userId, quantity);
                  }
                } else {
                  const prev = ORDERBOOK.get(stockSymbol)![stockType]!;
                  prev[priceKey] = {
                    total: quantity,
                    orders: new Map([[userId, quantity]]),
                  };
                }
              } else {
                const prev = ORDERBOOK.get(stockSymbol)!;
                prev[stockType] = {
                  [priceKey]: {
                    total: quantity,
                    orders: new Map([[userId, quantity]]),
                  },
                };
              }
            } else {
              ORDERBOOK.set(stockSymbol, {
                [stockType]: {
                  [priceKey]: {
                    total: quantity,
                    orders: new Map([[userId, quantity]]),
                  },
                },
              });
            }

            const eventExists = ORDER_QUEUES.SELL_ORDER_QUEUE.has(stockSymbol);

            if (eventExists) {
              const res = ORDER_QUEUES.SELL_ORDER_QUEUE.get(stockSymbol);

              res?.push({
                userId,
                quantity,
                price,
                stockType,
                timestamp: new Date(Date.now()),
              });
            } else {
              ORDER_QUEUES.SELL_ORDER_QUEUE.set(stockSymbol, [
                {
                  userId,
                  quantity,
                  price,
                  stockType,
                  timestamp: new Date(Date.now()),
                },
              ]);
            }

            const res = ORDER_QUEUES.SELL_ORDER_QUEUE.get(stockSymbol);

            if (res) {
              const res2 = sortSellOrderQueueByPrice(res);
              ORDER_QUEUES.SELL_ORDER_QUEUE.set(stockSymbol, res2);
            }

            const userBalanceDetails = INR_BALANCES.get(userId)!;

            INR_BALANCES.set(userId, {
              balance: userBalanceDetails.balance - quantity * price,
              locked: userBalanceDetails.locked + quantity * price,
            });
          }

          RedisManager.getInstance().sendToApi(clientID, {
            type: "SELL",
            payload: {
              message: "Sell order placed and pending",
            },
          });
          publishEvents({ stockSymbol: stockSymbol });
          break;
        }
        // STEP 2:- Iterate Buy Order Queue
        const indexesToBeDeleted = new Map();
        for (
          let i = 0;
          i < ORDER_QUEUES.BUY_ORDER_QUEUE.get(stockSymbol)!.length;
          i++
        ) {
          let {
            userId: buyerUserId,
            quantity: buyerQuantity,
            price: buyerPrice,
            stockType: buyerStockType,
          } = ORDER_QUEUES.BUY_ORDER_QUEUE.get(stockSymbol)![i];

          if (buyerStockType != stockType || buyerPrice < price) {
            continue;
          }

          let toBeExecuted = 0;

          if (buyerQuantity <= quantity) {
            indexesToBeDeleted.set(i, 1);
            toBeExecuted = buyerQuantity;
          } else {
            toBeExecuted = quantity;
          }

          // buyer details update
          INR_BALANCES.get(buyerUserId)!.locked -= toBeExecuted * buyerPrice;

          const temp1 = STOCK_BALANCES.get(buyerUserId);

          if (
            temp1 &&
            temp1.get(stockSymbol) &&
            temp1.get(stockSymbol)![stockType]
          ) {
            if (temp1.get(stockSymbol)![stockType]?.locked) {
              temp1.get(stockSymbol)![stockType]!.locked -= toBeExecuted;
            }
          }

          // BUYER details update
          INR_BALANCES.get(userId)!.balance -= toBeExecuted * buyerPrice;
          if (STOCK_BALANCES.has(userId)) {
            const userData = STOCK_BALANCES.get(userId)!;
            if (userData.has(stockSymbol)) {
              userData.get(stockSymbol)![stockType]!.quantity += toBeExecuted;
            } else {
              userData.set(stockSymbol, {
                yes: { quantity: 0, locked: 0 },
                no: { quantity: 0, locked: 0 },
              });
              userData.get(stockSymbol)![stockType]!.quantity += toBeExecuted;
            }
            STOCK_BALANCES.get(userId)!.get(stockSymbol)![
              stockType
            ]!.quantity += toBeExecuted;
          } else {
            STOCK_BALANCES.set(userId, new Map());
            const userData = STOCK_BALANCES.get(userId)!;

            userData.set(stockSymbol, {
              yes: { quantity: 0, locked: 0 },
              no: { quantity: 0, locked: 0 },
            });
            const data = userData.get(stockSymbol);

            if (data && data[stockType]) {
              data[stockType].quantity += toBeExecuted;
            }
          }

          quantity -= toBeExecuted;
          buyerQuantity -= toBeExecuted;

          if (buyerQuantity == 0) {
            indexesToBeDeleted.set(i, 1);
          }

          if (quantity == 0) {
            break;
          }
        }

        // Delete items
        const latest = ORDER_QUEUES.BUY_ORDER_QUEUE.get(stockSymbol)!.filter(
          (item, index) => {
            if (indexesToBeDeleted.has(index)) {
              return false;
            } else {
              return true;
            }
          }
        );

        ORDER_QUEUES.BUY_ORDER_QUEUE.set(stockSymbol, latest);

        if (quantity > 0) {
          const priceKey = (price / 100).toString();

          if (ORDERBOOK.has(stockSymbol)) {
            if (ORDERBOOK.get(stockSymbol)![stockType]) {
              if (ORDERBOOK.get(stockSymbol)![stockType]![priceKey]) {
                ORDERBOOK.get(stockSymbol)![stockType]![priceKey].total +=
                  quantity;
                if (
                  ORDERBOOK.get(stockSymbol)![stockType]![priceKey].orders.has(
                    userId
                  )
                ) {
                  const current =
                    ORDERBOOK.get(stockSymbol)![stockType]![
                      priceKey
                    ].orders.get(userId)!;
                  ORDERBOOK.get(stockSymbol)![stockType]![priceKey].orders.set(
                    userId,
                    quantity + current
                  );
                } else {
                  ORDERBOOK.get(stockSymbol)![stockType]![priceKey].orders.set(
                    userId,
                    quantity
                  );
                }
              } else {
                const prev = ORDERBOOK.get(stockSymbol)![stockType]!;
                prev[priceKey] = {
                  total: quantity,
                  orders: new Map([[userId, quantity]]),
                };
              }
            } else {
              const prev = ORDERBOOK.get(stockSymbol)!;
              prev[stockType] = {
                [priceKey]: {
                  total: quantity,
                  orders: new Map([[userId, quantity]]),
                },
              };
            }
          } else {
            ORDERBOOK.set(stockSymbol, {
              [stockType]: {
                [priceKey]: {
                  total: quantity,
                  orders: new Map([[userId, quantity]]),
                },
              },
            });
          }

          const eventExists = ORDER_QUEUES.SELL_ORDER_QUEUE.has(stockSymbol);

          if (eventExists) {
            const res = ORDER_QUEUES.SELL_ORDER_QUEUE.get(stockSymbol);

            res?.push({
              userId,
              quantity,
              price,
              stockType,
              timestamp: new Date(Date.now()),
            });
          } else {
            ORDER_QUEUES.SELL_ORDER_QUEUE.set(stockSymbol, [
              {
                userId,
                quantity,
                price,
                stockType,
                timestamp: new Date(Date.now()),
              },
            ]);
          }

          const res = ORDER_QUEUES.SELL_ORDER_QUEUE.get(stockSymbol);

          if (res) {
            const res2 = sortSellOrderQueueByPrice(res);
            ORDER_QUEUES.SELL_ORDER_QUEUE.set(stockSymbol, res2);
          }

          const userBalanceDetails = INR_BALANCES.get(userId)!;

          INR_BALANCES.set(userId, {
            balance: userBalanceDetails.balance - quantity * price,
            locked: userBalanceDetails.locked + quantity * price,
          });
        }

        if (quantity == 0) {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "SELL",
            payload: {
              message: "Sell order placed and trade executed",
            },
          });
        } else if (quantity == origQuantity) {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "SELL",
            payload: {
              message: "Sell order placed and pending",
            },
          });
        } else {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "SELL",
            payload: {
              message: `Sell order matched partially, ${quantity} remaining`,
            },
          });
        }

        publishEvents({ stockSymbol: stockSymbol });

      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "GET_USER_BALANCE",
          payload: {
            message: "Unable to fetch data",
          },
        });
      }

      break;
    case "MINT":
      try {
        let { userId, stockSymbol, quantity, price } = request.data;
        stockSymbol = decodeURIComponent(stockSymbol);
        const reqdBalance = 2 * quantity * price;

        const userBalance = INR_BALANCES.get(userId)!.balance;

        if (userBalance < reqdBalance) {
          RedisManager.getInstance().sendToApi(clientID, {
            type: "MINT",
            payload: {
              message: "Insufficient User Balance",
            },
          });
          break;
        }

        // STEP 1:- UPDATE USER BALANCE
        const userBalanceData = INR_BALANCES.get(userId);
        INR_BALANCES.set(userId, {
          balance: userBalance - reqdBalance,
          locked: userBalanceData!.locked,
        });

        // STEP 2:- UPDATE STOCK BALANCES
        const stockBalanceData = STOCK_BALANCES.get(userId)!;
        const stockAlreadyExists = stockBalanceData.get(stockSymbol);

        if (stockAlreadyExists) {
          const yesExists = stockBalanceData.get(stockSymbol)?.yes;
          const noExists = stockBalanceData?.get(stockSymbol)?.no;

          if (yesExists) {
            stockBalanceData.get(stockSymbol)!.yes!.quantity += quantity;
          } else {
            stockBalanceData.get(stockSymbol)!["yes"] = {
              locked: 0,
              quantity: quantity,
            };
          }

          if (noExists) {
            stockBalanceData.get(stockSymbol)!.no!.quantity += quantity;
          } else {
            stockBalanceData.get(stockSymbol)!["no"] = {
              locked: 0,
              quantity: quantity,
            };
          }
        } else {
          stockBalanceData.set(stockSymbol, {yes: {quantity: quantity, locked: 0}, no: {quantity: quantity, locked: 0}})
        }

        const remainingBalacnce = INR_BALANCES.get(userId)!.balance;

        RedisManager.getInstance().sendToApi(clientID, {
          type: "MINT",
          payload: {
            message: `Minted ${quantity} 'yes' and 'no' tokens for user ${userId}, remaining balance is ${remainingBalacnce}`,
          },
        });
      } catch (e) {
        RedisManager.getInstance().sendToApi(clientID, {
          type: "REQUEST_FAILED",
          payload: {
            message: "Could not mint tokens",
          },
        });
      }
      break;
  }

  // Processing logic

  // Send to DB to process the request

  // Send it back to queue for websocket server to pick it up
  // redisClient.lPush("ws_server", serializeOrderBook(ORDERBOOK));

  redisClient.lPush("db_server:orderbook", serializeOrderBook(ORDERBOOK));
  redisClient.rPush(
    "db_server:inr_balances",
    serializeUserBalances(INR_BALANCES)
  );
  redisClient.lPush(
    "db_server:stock_balances",
    serializeStockBalances(STOCK_BALANCES)
  );
  redisClient.lPush(
    "db_server:order_queues",
    serializeOrderQueues(ORDER_QUEUES)
  );
  redisClient.lPush(
    "db_server:stock_endtimes",
    serializeStockEndTimes(STOCK_END_TIMES)
  );
}

const handleEventEnd = (event: string) => {
  const choices = ["yes", "no"];

  const winner = choices[Math.floor(Math.random() * 2)];

  const sellQueue = ORDER_QUEUES.SELL_ORDER_QUEUE.has(event)
    ? ORDER_QUEUES.SELL_ORDER_QUEUE.get(event)
    : [];
  const buyQueue = ORDER_QUEUES.BUY_ORDER_QUEUE.has(event)
    ? ORDER_QUEUES.BUY_ORDER_QUEUE.get(event)
    : [];

  ORDER_QUEUES.SELL_ORDER_QUEUE.delete(event);
  ORDER_QUEUES.BUY_ORDER_QUEUE.delete(event);

  sellQueue?.map((data) => {
    const { userId, quantity, price, stockType } = data;

    let currentBalance = INR_BALANCES.get(userId)!.balance;
    let locked = INR_BALANCES.get(userId)!.locked;

    if (marketMakerUsers.has(userId)) {
      INR_BALANCES.set(userId, { balance: currentBalance, locked: locked-(quantity * price) });
      return;
    }

    currentBalance += quantity * price;
    locked -= quantity * price;
    INR_BALANCES.set(userId, { balance: currentBalance, locked: locked });
  });

  buyQueue?.map((data) => {
    const { userId, quantity, price, stockType } = data;

    let currentBalance = INR_BALANCES.get(userId)!.balance;
    let locked = INR_BALANCES.get(userId)!.locked;

    currentBalance += quantity * price;
    locked -= quantity * price;
    INR_BALANCES.set(userId, { balance: currentBalance, locked: locked });
  });

  ORDERBOOK.delete(event);

  for (const [user, eventObject] of STOCK_BALANCES) {

    if (marketMakerUsers.has(user)) {
      continue;
    }

    if (eventObject.has(event)) {

      const res = eventObject.get(event);

      if ((winner === "yes" && res?.yes) || (winner === "no" && res?.no)) {
        let currentBalance = INR_BALANCES.get(user)!.balance;
        let locked = INR_BALANCES.get(user)!.locked;
        currentBalance += res[winner]!.quantity * 10 * 100;
        INR_BALANCES.set(user, { balance: currentBalance, locked: locked });
      }
    }
  }

  for (const user of STOCK_BALANCES) {
    if (user[1].has(event)) {
      user[1].delete(event);
    }
  }

  publishEvents({ stockSymbol: event });
};

const checkForEndedEvents = () => {
  const toBeDeleted = [];
  for (const [event, endTime] of STOCK_END_TIMES) {

    const diff = new Date(endTime).getTime() - new Date().getTime();
    if (diff > 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const timeLeft = `${minutes}m ${seconds}s`;

    } else {
      handleEventEnd(event);
      toBeDeleted.push(event);
    }
  }

  for (let i = 0; i < toBeDeleted.length; i++) {
    STOCK_END_TIMES.delete(toBeDeleted[i]);
  }
};

async function main() {
  try {
    await redisClient.connect();
    await pubsubClient.connect();

    pubsubClient.publish("sync:db", JSON.stringify({type: "engine-restart"}));

    await new Promise<void>((resolve) => {
      pubsubClient.subscribe("archiver:ack", (message) => {
        if (message === "sync-complete") {
          console.log("Archiver sync done!");
          resolve();
        }
      });
    });

    await initData();


    console.log("Engine connected, listening to requests");

    setInterval(checkForEndedEvents, 1000);

    while (true) {
      const response = await redisClient.brPop("requests", 0);

      if (response) {
        await processSubmission(JSON.parse(response.element));
      }
    }
  } catch (e) {
    console.log("server stopped")
    console.log("Engine server failed to start:- ", e);
  }
}

main();
