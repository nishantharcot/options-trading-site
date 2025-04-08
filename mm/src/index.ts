import { MarketMaker } from "./MarketMaker";
import dotenv from "dotenv";

dotenv.config();

function marketMakers() {
  function startMarket() {
    async function temp() {
      try {
        // Create users
        let res:any = await MarketMaker.getInstance().createUsers();
  
        // Add balance to all users
        res = await MarketMaker.getInstance().addBalanceToAllUsers(10000000);
  
        // initializeEventsAndMintTokens
        res = await MarketMaker.getInstance().initializeEventsAndMintTokens();
  
        console.log("starting after initializeEventsAndMintTokens");
        setInterval(MarketMaker.getInstance().placeOrderRandomly, 300);
      } catch(e) {
        console.log('error: ', e);
        startMarket();
      }
    }

    temp();
  }

  startMarket();
}

marketMakers();
