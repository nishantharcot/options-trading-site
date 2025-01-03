export type STOCK_TYPE = "yes" | "no";

export type MessageFromApi =
  | {
      type: "CREATE_USER";
      data: {
        userId: string;
      };
    }
  | {
      type: "CREATE_SYMBOL";
      data: {
        stockSymbol: string;
      };
    }
  | {
      type: "GET_ORDERBOOK";
    }
  | {
      type: "GET_ORDERBOOK_FOR_EVENT";
      data: {
        event: string;
      };
    }
  | {
      type: "GET_INR_BALANCES";
    }
  | {
      type: "GET_STOCK_BALANCES";
    }
  | {
      type: "RESET_DATA";
    }
  | {
      type: "ONRAMP_INR";
      data: {
        userId: string;
        amount: number;
      };
    }
  | {
      type: "GET_USER_BALANCE";
      data: {
        userId: string;
      };
    }
  | {
      type: "BUY";
      data: {
        userId: string;
        stockSymbol: string;
        quantity: number;
        price: number;
        stockType: STOCK_TYPE;
      };
    }
  | {
      type: "SELL";
      data: {
        userId: string;
        stockSymbol: string;
        quantity: number;
        price: number;
        stockType: STOCK_TYPE;
      };
    }
  | {
      type: "MINT";
      data: {
        userId: string;
        stockSymbol: string;
        quantity: number;
        price: number;
      };
    };
