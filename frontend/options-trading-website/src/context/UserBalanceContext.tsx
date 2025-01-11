"use client";

import React, { createContext, ReactNode, useState } from "react";

export type UserBalanceContextType = {
  userBalance: number;
  setUserBalance: React.Dispatch<React.SetStateAction<number>>;
};

export const UserBalanceContext = createContext<UserBalanceContextType>({
  userBalance: 0,
  setUserBalance: () => {
    console.log("filler");
  },
});

export function UserBalanceProvider({ children }: { children: ReactNode }) {
  const [userBalance, setUserBalance] = useState(0);

  return (
    <UserBalanceContext.Provider value={{ userBalance, setUserBalance }}>
      {children}
    </UserBalanceContext.Provider>
  );
}
