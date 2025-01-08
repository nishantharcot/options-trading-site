const API_URL = "http://localhost:3000";


const events = ["Will 2024 be recorded as the hottest year on record by NASA?", "Zomato's revenue to be ₹5400 crore or more for Q3 of FY25?", "Elon Musk to rank higher than Mark Zuckerberg according to Forbes World 's Billionaires List 2025?"];

const possiblePrices = [950, 900, 850, 800, 750, 700, 650, 600, 550, 500, 450, 400, 350, 300, 250]

const getRandomIndex = (max: number) => {
  return Math.floor(Math.random() * max)
}

const users: string[] = [];
for (let i = 0; i < 100; i++) {
  users.push(`mm${i}`);
}


async function main() {
  const userPromises = users.map(async userId => {
    const res = await fetch(API_URL + `/user/create/${userId}`, { method: "POST" })
    const res2 = await res.json();
    return res2;
  })

  const userValues = await Promise.all(userPromises);
  console.log(userValues)

  const eventPromises = events.map(async event => {
    const res = await fetch(API_URL + `/symbol/create/${encodeURIComponent(event)}`, { method: "POST" });
    const res2 = await res.json();
    return res2;
  })

  const eventValues = await Promise.all(eventPromises);
  console.log(eventValues)

  const onrampPromises = users.map(async userId => {
    const res = await fetch(API_URL + "/onramp/inr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: 10000000,
        userId: userId
      })
    });
    const res2 = await res.json();
    return res2;
  })

  const onrampValues = await Promise.all(onrampPromises)
  console.log(onrampValues)

  const mintPromises = events.map(async event => {
    const mintPromises2 = users.map(async userId => {
      const res = await fetch(API_URL + "/trade/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          stockSymbol: event,
          userId: userId,
          quantity: 20,
          price: 1000,
        })
      })

      const res2 = await res.json();
      return res2;
    })

    const mintPromises2Values = await Promise.all(mintPromises2)
    return mintPromises2Values;
  })

  const mintPromisesValues = await Promise.all(mintPromises)
  console.log(mintPromisesValues)

  // STOCK Balance check
  const res = await fetch(API_URL + "/balances/stock");
  const res2 = await res.json()

  console.log('res2:- ', res2)
  console.log('typeof res2:- ', typeof res2)
  console.log('entries:- ' ,Object.keys(res2))
  console.log('sample:- ', res2['mm99'])

  setInterval(async () => {
    // Place sell orders

    const sellOrdersPromises = events.map(async event => {
      const userId = users[getRandomIndex(100)]
      const price = possiblePrices[getRandomIndex(15)]

      const quantity = 1+getRandomIndex(5);


      const tempRes = await fetch(API_URL + "/order/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockSymbol: event,
          userId: userId,
          quantity: quantity,
          price: price,
          stockType: "yes"
        }),
      })

      const tempRes2 = await fetch(API_URL + "/order/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockSymbol: event,
          userId: userId,
          quantity: quantity,
          price: 1000 - price,
          stockType: "no"
        }),
      })
      const res = await tempRes.json()
      const res2 = await tempRes2.json()
      return [res, res2];
    })

    const sellOrdersPromisesValues = await Promise.all(sellOrdersPromises);
    console.log(sellOrdersPromisesValues)

}, 2000)

}


main();
