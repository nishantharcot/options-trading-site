/* eslint-disable @typescript-eslint/no-explicit-any */


import { useEffect, useState } from "react";
import { API_URL } from "@/config";


export type EventDetails = {
  event: string;
  yesPrice: number;
  noPrice: number;
  endTime: string;
  timeLeft: string;
};

export function useStockEvents() {
  const [events, setEvents] = useState<EventDetails[]>([]);

  useEffect(() => {

    async function fetchData() {
      try {
        const stockendTimesJson = await fetch(`${API_URL}/stockendtimes`);
        const stockEndTimeData = await stockendTimesJson.json();

        const orderbookJson = await fetch(`${API_URL}/orderbook`);
        const orderbookData = await orderbookJson.json();

        if (!orderbookData) return;

        const temp: EventDetails[] = [];

        orderbookData.forEach((data: any) => {
          const eventName = data[0];
          let yP = 10,
            nP = 0;

          if (data[1].hasOwnProperty("no") && data[1].hasOwnProperty("yes")) {
            const noData = Object.entries(data[1].no);
            noData.forEach((noPoint) => {
              nP = Math.max(nP, Number(noPoint[0]));
            });

            const yesData = Object.entries(data[1].yes);
            yesData.forEach((yesPoint) => {
              yP = Math.min(yP, Number(yesPoint[0]));
            });

            let res = "";
            const diff =
              new Date(stockEndTimeData[eventName]).getTime() -
              new Date().getTime();
            if (diff > 0) {
              const minutes = Math.floor(diff / (1000 * 60));
              const seconds = Math.floor((diff % (1000 * 60)) / 1000);
              res = `${minutes}m ${seconds}s`;
            }

            if (res !== "") {
              temp.push({
                event: eventName,
                yesPrice: yP,
                noPrice: nP,
                endTime: stockEndTimeData[eventName],
                timeLeft: res,
              });
            }
          }
        });
        console.log("temp check:- ", temp);
        setEvents(temp);
      } catch (err) {
        console.error("Failed to fetch event data", err);
      }
    }

    fetchData();
    const interval1 = setInterval(fetchData, 10 * 1000);

    return () => {
      clearInterval(interval1);
    };
  }, []);

  return events;
}
