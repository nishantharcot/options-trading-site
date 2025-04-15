import dotenv from "dotenv";

dotenv.config();

export const API_URL = process.env.NEXT_PUBLIC_API_URL!;
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;