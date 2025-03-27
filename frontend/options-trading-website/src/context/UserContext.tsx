"use client";

import React, { createContext, ReactNode, useState } from "react";

export type UserContextType = {
  userId: string | null;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;
  userBalance: number;
  setUserBalance: React.Dispatch<React.SetStateAction<number>>;
};

export const UserContext = createContext<UserContextType>({
  userId: null,
  setUserId: () => console.log("filler"),
  userBalance: 0,
  setUserBalance: () => console.log("filler"),
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);

  return (
    <UserContext.Provider
      value={{ userId, setUserId, userBalance, setUserBalance }}
    >
      {children}
    </UserContext.Provider>
  );
}
