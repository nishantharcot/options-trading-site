import { MarketMaker } from "./MarketMaker";

function marketMakers() {
  function startMarket() {
    async function temp() {
      // Create users
      let res = await MarketMaker.getInstance().createUsers();
      console.log(res);

      // Add balance to all users
      res = await MarketMaker.getInstance().addBalanceToAllUsers();
      console.log(res);

      // initializeEventsAndMintTokens
      res = await MarketMaker.getInstance().initializeEventsAndMintTokens();
      console.log("initializeEventsAndMintTokens res check: ", res);

      console.log("starting after initializeEventsAndMintTokens");
      setInterval(MarketMaker.getInstance().placeOrderRandomly, 300);
    }

    temp();
  }

  startMarket();
}

marketMakers();
