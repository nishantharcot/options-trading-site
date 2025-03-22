export const CREATE_USER = "CREATE_USER";

export type STOCK_TYPE = "yes" | "no";

export type API_TO_ENGINE_ORDER_TYPES =
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
        endTime: Date;
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
    } | {
      type: "GET_STOCK_END_TIMES";
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

export type ENGINE_TO_API_RESPONSE_TYPES = {
  payload: {
    message: string;
  };
};
