export type MessageToApi =
  | {
      type: "USER_CREATED";
      payload: {
        message: string;
      };
    }
  | {
      type: "SYMBOL_CREATED";
      payload: {
        message: string;
      };
    }
  | {
      type: "REQUEST_FAILED";
      payload: {
        message: string;
      };
    }
  | {
      type: "GET_ORDERBOOK";
      payload: {
        message: string;
      };
    }
  | {
      type: "GET_ORDERBOOK_FOR_EVENT";
      payload: {
        message: string;
      };
    }
  | {
      type: "GET_STOCK_BALANCES";
      payload: {
        message: string;
      };
    }
  | {
      type: "GET_INR_BALANCES";
      payload: {
        message: string;
      };
    }
  | {
    type: "GET_STOCK_END_TIMES",
    payload: {
      message: string
    }
  } | {
      type: "RESET_DATA";
      payload: {
        message: string;
      };
    }
  | {
      type: "ONRAMP_INR";
      payload: {
        message: string;
      };
    }
  | {
      type: "GET_USER_BALANCE";
      payload: {
        message: string;
      };
    }
  | {
      type: "BUY";
      payload: {
        message: string;
      };
    }
  | {
      type: "SELL";
      payload: {
        message: string;
      };
    }
  | {
      type: "MINT";
      payload: {
        message: string;
      };
    };
