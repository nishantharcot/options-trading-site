import { MarketMaker } from "./MarketMaker";

function marketMakers() {
  function startMarket() {
    async function temp() {
      try {
        // Create users
        let res = await MarketMaker.getInstance().createUsers();
  
        // Add balance to all users
        res = await MarketMaker.getInstance().addBalanceToAllUsers();
  
        // initializeEventsAndMintTokens
        res = await MarketMaker.getInstance().initializeEventsAndMintTokens();
  
        console.log("starting after initializeEventsAndMintTokens");
        setInterval(MarketMaker.getInstance().placeOrderRandomly, 300);
      } catch(e) {
        console.log('error: ', e);
      }
    }

    temp();
  }

  startMarket();
}

marketMakers();
