const API_URL = "http://localhost:3000";

const events = ["BTC", "USD", "TATA"];

const possiblePrices = [950, 900, 850, 800, 750, 700, 650, 600, 550, 500]

const getRandomIndex = (max: number) => {
  return Math.floor(Math.random() * max)
}

const users: string[] = [];
for (let i = 0; i < 100; i++) {
  users.push(`mm${i}`);
}

// console.log('users check:- ', users)

async function createEventsAndUsers() {
  users.forEach(async (userId) => {
    const res = await fetch(API_URL + `/user/create/${userId}`, { method: "POST" })
    const finalRes = await res.json()
    console.log('users check:-', finalRes)

  });


  events.forEach(async (ele) => {
    const res = await fetch(API_URL + `/symbol/create/${ele}`, { method: "POST" })
    const finalRes = await res.json();
    console.log('symbols check:-', finalRes)

  });
}

async function addMoneyAndMint() {

  await Promise.all(
    users.map(async (userId) => {
      const res = await fetch(API_URL + `/onramp/inr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Set content type to JSON
        },
        body: JSON.stringify({
          amount: 10000000,
          userId: userId,
        }),
      })
      const finalRes = await res.json()
      console.log('onramp inr check:- ', finalRes)
    })
  )

  await Promise.all(
    events.map(async (event) => {
      return users.map(async (user) => {
        console.log('before user check:- ', user)
        const res = await fetch(API_URL + "/trade/mint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stockSymbol: event,
            userId: user,
            quantity: 100,
            price: 1000
          }),
        })
        const finalRes = await res.json()
        return finalRes
      });
    })
  )

  console.log('yoyy mna')
  main();
}

async function main() {

  console.log('main started!!')

  setInterval(() => {
      // Place sell orders
      events.forEach(event => {
        const userId = users[getRandomIndex(100)]
        const price = possiblePrices[getRandomIndex(10)]
        const randomPick = Math.floor(Math.random() * 2)
        const stockType = randomPick ? 'yes' : 'no'

        fetch(API_URL + "/order/sell", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stockSymbol: event,
            userId: userId,
            quantity: 1+getRandomIndex(5),
            price: price,
            stockType: stockType
          }),
        })
        .then(res => res.json())
        .then(finalRes => {
          console.log(finalRes)
        })
      })
  }, 2000)
}

createEventsAndUsers();
addMoneyAndMint();