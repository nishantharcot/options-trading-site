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

const redisClient = createClient();

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
        // console.log('orderbook:- ', ORDERBOOK)
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

        // console.log('stockEndTimes:- ', stockEndTimes)

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

        if (INR_BALANCES.has(userId)) {
          const { balance } = INR_BALANCES.get(userId)!;

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

        // console.log('seller queue for this event:- ', ORDER_QUEUES.SELL_ORDER_QUEUE.get(stockSymbol));

        stockSymbol = decodeURIComponent(stockSymbol);

        // console.log("price:- ", price);
        // console.log("quantity:- ", quantity);

        // STEP 1:- CHECK FOR SUFFICIENT BALANCE
        const stockCost = quantity * price;

        const userBalance = INR_BALANCES.get(userId)!;
        // console.log("user Balance: ", userBalance);

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

        // console.log('exists:- ', exists);
        // console.log(ORDERBOOK.get(stockSymbol));

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

          // console.log('before locked update: ', INR_BALANCES.get(userId)!.locked)

          INR_BALANCES.get(userId)!.balance -= stockCost;
          INR_BALANCES.get(userId)!.locked += stockCost;

          // console.log('after locked update: ', INR_BALANCES.get(userId)!.locked)

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

        // console.log('res:- ', res)

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

          // console.log('stockType:- ', stockType);
          // console.log('sellerStockType:- ', sellerStockType);

          // console.log('price:- ', price);
          // console.log('sellerPrice:- ', sellerPrice);

          if (sellerStockType !== stockType || sellerPrice > price) {
            continue;
          }

          // console.log('yooyoy');

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
          // console.log('prev: ', ORDERBOOK.get(stockSymbol)![stockType]![priceKey].total);
          ORDERBOOK.get(stockSymbol)![stockType]![priceKey].total -=
            toBeExecuted;
          // console.log('after: ', ORDERBOOK.get(stockSymbol)![stockType]![priceKey].total);
          const prevQuantity =
            ORDERBOOK.get(stockSymbol)![stockType]![priceKey].orders.get(
              sellerUserId
            )!;

          // console.log('prev check:- ', ORDERBOOK.get(stockSymbol)![stockType]![priceKey].orders);
          ORDERBOOK.get(stockSymbol)![stockType]![priceKey].orders.set(
            sellerUserId,
            prevQuantity - toBeExecuted
          );
          // console.log('after check:- ', ORDERBOOK.get(stockSymbol)![stockType]![priceKey].orders);

          // console.log("seller price:- ", sellerPrice);

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

        // console.log('Sell order queue before ', stockSymbol, " ", ORDER_QUEUES.SELL_ORDER_QUEUE.get(stockSymbol));

        stockSymbol = decodeURIComponent(stockSymbol);

        // console.log("SELL Order received!!!")

        // console.log('user:- ', userId)
        // console.log('quantity:- ', quantity)
        // console.log('stock symbol:- ', stockSymbol);
        // console.log('stock exists:- ', STOCK_BALANCES.get(userId)?.get(stockSymbol));

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

        // console.log("SELL Order received part 2!!!")

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
              message: "Stock balance insufficient",
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

        // console.log("SELL Order received part 3!!!")

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

        // console.log('reach checkingggggggg')

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
        // console.log("publishEvents in SELL");
        publishEvents({ stockSymbol: stockSymbol });

        // console.log('Sell order queue after ', stockSymbol, " ", ORDER_QUEUES.SELL_ORDER_QUEUE.get(stockSymbol));
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
          // console.log("qeikvbqkefqnebovqbvikqnvqolvbqeikvk");
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

        // console.log(`stock balance for ${stockSymbol} `, userId, STOCK_BALANCES.get(userId)?.get(stockSymbol));

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

  // console.log("yoyo man!");

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

  console.log('INR_BALANCES: ', INR_BALANCES);

  sellQueue?.map((data) => {
    const { userId, quantity, price, stockType } = data;

    console.log('userId: ', userId);

    let currentBalance = INR_BALANCES.get(userId)!.balance;
    let locked = INR_BALANCES.get(userId)!.locked;

    currentBalance += quantity * price;
    locked -= quantity * price;
    INR_BALANCES.set(userId, { balance: currentBalance, locked: locked });
  });

  console.log('yoyo man!!')

  buyQueue?.map((data) => {
    const { userId, quantity, price, stockType } = data;

    let currentBalance = INR_BALANCES.get(userId)!.balance;
    let locked = INR_BALANCES.get(userId)!.locked;

    currentBalance += quantity * price;
    locked -= quantity * price;
    INR_BALANCES.set(userId, { balance: currentBalance, locked: locked });
  });

  ORDERBOOK.delete(event);

  console.log('yoyo man 2!!')

  for (const [user, eventObject] of STOCK_BALANCES) {
    console.log('user: ', user);
    // console.log('eventObject: ', eventObject);

    if (eventObject.has(event)) {
      // console.log('checkingggg: ', eventObject.get(event))

      const res = eventObject.get(event);

      // if ((winner === "yes" && res?.yes) || (winner === "no" && res?.no)) {
      //   let currentBalance = INR_BALANCES.get(user)!.balance;
      //   let locked = INR_BALANCES.get(user)!.locked;
      //   currentBalance += res[winner]!.quantity * 10 * 100;
      //   INR_BALANCES.set(user, { balance: currentBalance, locked: locked });
      // }

      if (winner === "yes" && res?.yes) {
        let currentBalance = INR_BALANCES.get(user)!.balance;
        let locked = INR_BALANCES.get(user)!.locked;
        currentBalance += res.yes.quantity * 10 * 100;
        INR_BALANCES.set(user, { balance: currentBalance, locked: locked });
      }

      if (winner === "no" && res?.no) {
        let currentBalance = INR_BALANCES.get(user)!.balance;
        let locked = INR_BALANCES.get(user)!.locked;
        currentBalance += res.no.quantity * 10 * 100;
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
  console.log("event count:- ", STOCK_END_TIMES.size);
  for (const [event, endTime] of STOCK_END_TIMES) {

    const diff = new Date(endTime).getTime() - new Date().getTime();
    if (diff > 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const timeLeft = `${minutes}m ${seconds}s`;

      console.log("event: ", event, "time left: ", timeLeft);
    } else {
      console.log(`Event ${event} ended`);
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
    await initData();

    await redisClient.connect();

    console.log("Engine connected, listening to requests");

    setInterval(checkForEndedEvents, 1000);

    while (true) {
      const response = await redisClient.brPop("requests", 0);

      if (response) {
        await processSubmission(JSON.parse(response.element));
      }
    }
  } catch (e) {
    console.log("Engine server failed to start:- ", e);
  }
}

main();
