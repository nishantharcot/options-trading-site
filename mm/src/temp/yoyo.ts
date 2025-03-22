

// const API_URL = "http://localhost:3000";

// const events = ["Will 2024 be recorded as the hottest year on record by NASA?",
//   "Zomato's revenue to be ₹5400 crore or more for Q3 of FY25?",
//   "Elon Musk to rank higher than Zuckerberg according to Forbes Billionaires List 2025?"
// ];

// const eventEndTimes = new Map();

// const possiblePrices = [950, 900, 850, 800, 750, 700, 650]

// const getRandomIndex = (max: number) => {
//   return Math.floor(Math.random() * max)
// }

// const users: string[] = [];
// for (let i = 0; i < 100; i++) {
//   users.push(`mm${i}`);
// }

// let flag = 1;


// async function main() {
//   const userPromises = users.map(userId => {
//     return fetch(API_URL + `/user/create/${userId}`, { method: "POST" })
//   })

//   const userValuesJson = await Promise.all(userPromises);
//   const userValuesData = await Promise.all(userValuesJson.map(d => d.json()));
//   // console.log("Users created!!!");

//   let c = 1;

//   const eventPromises = events.map(event => {
//     const deadline = new Date(Date.now() + (c++) * 60 * 1000);
//     eventEndTimes.set(event, deadline);

//     return fetch(API_URL + `/symbol/create/${encodeURIComponent(event)}`, { method: "POST", headers: {
//       "Content-Type": "application/json"
//     }, body: JSON.stringify({
//       endTime: deadline
//     }) });
//   })

//   const eventValuesJson = await Promise.all(eventPromises);
//   const eventValuesData = await Promise.all(eventValuesJson.map(d => d.json()));
//   // console.log("Events created!!!");

//   const onrampPromises = users.map(userId => {
//     return fetch(API_URL + "/onramp/inr", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         amount: 10000000,
//         userId: userId
//       })
//     });
//   })

//   const onrampValuesJson = await Promise.all(onrampPromises);
//   const onrampValuesData = await Promise.all(onrampValuesJson.map(d => d.json()));
//   // console.log("Money added to users!!");


//   const mintPromises: any[] = [];
//   events.map(event => {
//     const res = users.map(userId => {
//       return fetch(API_URL + "/trade/mint", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           stockSymbol: event,
//           userId: userId,
//           quantity: 20,
//           price: 1000,
//         })
//       })
//     })

//     mintPromises.push(...res);
//   })

//   const mintPromisesValuesJson = await Promise.all(mintPromises)
//   const mintPromisesValuesData = await Promise.all(mintPromisesValuesJson.map(d => d.json()));
//   // console.log("Minted!!!");

//   const intervalID = setInterval(() => {
//     if (eventEndTimes.size === 0) {
//       clearInterval(intervalID);
//     }

//     if (eventEndTimes.size === 2 && flag === 1) {
//       flag = 0;
//       setInterval(repeat, 60*1000);
//     }
    
//     async function placeOrders() {
//       let prev = 0;
//       const sellOrdersPromises: any[] = [];
//       events.map(event => {

//         if (!eventEndTimes.has(event)) {
//           return;
//         }

//         const deadline = eventEndTimes.get(event);
//         const current = new Date().getTime();

//         if (current >= deadline) {
//           eventEndTimes.delete(event);
//           return;
//         }




//         const userId = users[getRandomIndex(100)]
//         const price = possiblePrices[getRandomIndex(7-prev)]
//         prev += 1;
  
//         const quantity = 1+getRandomIndex(5);
  
//         const p1 = fetch(API_URL + "/order/sell", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             stockSymbol: event,
//             userId: userId,
//             quantity: quantity,
//             price: price,
//             stockType: "yes"
//           }),
//         })
  
//         const p2 = fetch(API_URL + "/order/sell", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             stockSymbol: event,
//             userId: userId,
//             quantity: quantity,
//             price: 1000 - price,
//             stockType: "no"
//           }),
//         })

//         sellOrdersPromises.push(...[p1, p2]);
//       })
  
//       const sellOrdersPromisesValues = await Promise.all(sellOrdersPromises);
//     }

//     placeOrders();
//   }, 500)
// }

// async function repeat() {
//   console.log('events check:- ', events);
//   const currentEvent = events[0];
//   const prev = events.shift();
//   if (prev) {
//     events.push(prev);
//   }

//   const deadline = new Date(Date.now() + 3 * 60 * 1000);
//   eventEndTimes.clear();
//   eventEndTimes.set(currentEvent, deadline);
//   const res = await fetch(API_URL + `/symbol/create/${encodeURIComponent(currentEvent)}`, { method: "POST", headers: {
//     "Content-Type": "application/json"
//   }, body: JSON.stringify({
//     endTime: deadline
//   }) });
  
//   const res2 = await res.json();

//   // console.log('res2 check: ', res2);

//   const userBalanceResponses = [];

//   for (let i = 0; i < 100; i++) {
//     const user = `mm${i}`;
//     userBalanceResponses.push(fetch(API_URL + `/balances/inr/${user}`));
//   }

//   const userBalanceJson = await Promise.all(userBalanceResponses);
//   const userBalanceData = await Promise.all(userBalanceJson.map(userBalance => userBalance.json()));

//   // console.log('userBalanceData: ', userBalanceData);


//   const addBalancePromises = [];
//   for (let i = 0; i < 100; i++) {
//     if (userBalanceData[i].message < 10000000) {
//       const user = `mm${i}`;
//       const rem  = 10000000 - userBalanceData[i];

//       addBalancePromises.push(fetch(API_URL + "/onramp/inr", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           amount: rem,
//           userId: user
//         })
//       }))
//     }
//   }

//   const addBalanceJson = await Promise.all(addBalancePromises);
//   const addBalanceData = await Promise.all(addBalanceJson.map(addBalance => addBalance.json()));

//   // console.log('addBalanceData: ', addBalanceData)

//   const mintPromises = users.map(userId => {
//     return fetch(API_URL + "/trade/mint", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         stockSymbol: currentEvent,
//         userId: userId,
//         quantity: 20,
//         price: 1000,
//       })
//     })

//   })

//   const mintPromisesJson = await Promise.all(mintPromises);
//   const mintPromisesData = await Promise.all(mintPromisesJson.map(d => d.json()));

//   // console.log('mintPromisesData: ', mintPromisesData);

//   const intervalID = setInterval(() => {
//     const current = new Date();

//     if (!eventEndTimes.has(currentEvent)) {
//       console.log('eventEndTimes: ', eventEndTimes);
//       console.log('currentEvent: ', currentEvent);
//     }

//     if (current.getTime() >= eventEndTimes.get(currentEvent).getTime() ) {
//       clearInterval(intervalID)
//       return;
//     }

//     // Place sell orders
//     async function placeOrders() {
//       const userId = users[getRandomIndex(100)]
//       const price = possiblePrices[getRandomIndex(7)]
  
//       const quantity = 1+getRandomIndex(5);
  
//       const tempRes = await fetch(API_URL + "/order/sell", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           stockSymbol: currentEvent,
//           userId: userId,
//           quantity: quantity,
//           price: price,
//           stockType: "yes"
//         }),
//       })
  
//       const tempRes2 = await fetch(API_URL + "/order/sell", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           stockSymbol: currentEvent,
//           userId: userId,
//           quantity: quantity,
//           price: 1000 - price,
//           stockType: "no"
//         }),
//       })
//       const res = await tempRes.json()
//       const res2 = await tempRes2.json()
//     }

//     placeOrders();
//   }, 2000)

// }

// main();