import express from "express";
import jwt from "jsonwebtoken";

export const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  const token2 = req.cookies?.authToken;

  // console.log("token 1:- ", token);
  // console.log("token 2:- ", token2);

  if (!token && !token2) {
    res.status(401).json({ message: "Token missing" });
    return;
  }

  let finalToken;
  if (token) {
    finalToken = token;
  } else {
    finalToken = token2;
  }

  try {
    const decoded = jwt.verify(finalToken, process.env.JWT_SECRET!);
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
    return;
  }
};