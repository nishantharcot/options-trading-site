"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

import Navbar from "@/components/Navbar";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserContext, UserContextType } from "@/context/UserContext";

type EventDetails = {
  event: string;
  yesPrice: number;
  noPrice: number;
  endTime: Date;
  timeLeft: string;
};

export default function EventsScreen() {
  const [events, setEvents] = useState<EventDetails[]>([]);
  const { setUserId }: UserContextType = useContext(UserContext);

  const API_URL = "https://optixchanges.com/api";

  const router = useRouter();

  useEffect(() => {
    fetch(API_URL + "/check-auth", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("auth check data:- ", data);
        if (!data.authenticated) {
          router.replace("/");
        } else {
          setUserId(data.user.userId);
        }
      });
  }, []);

  useEffect(() => {
    async function fetchData() {
      const stockendTimesJson = await fetch(`${API_URL}/stockendtimes`);

      const stockEndTimeData = await stockendTimesJson.json();

      const orderbookJson = await fetch(`${API_URL}/orderbook`);
      const orderbookData = await orderbookJson.json();

      if (!orderbookData) {
        return;
      }

      const temp: EventDetails[] = [];

      // console.log("orderbookData:- ", orderbookData);

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

      // console.log("temp check:- ", temp);

      setEvents(temp);
      const interval = setInterval(() => {
        setEvents((temp) => {
          return temp.filter((data) => {
            const diff =
              new Date(data.endTime).getTime() - new Date().getTime();
            if (diff > 0) {
              const minutes = Math.floor(diff / (1000 * 60));
              const seconds = Math.floor((diff % (1000 * 60)) / 1000);
              data.timeLeft = `${minutes}m ${seconds}s`;
              return data;
            }
          });
        });
      }, 1000);

      return () => clearInterval(interval);
    }

    fetchData();
    setInterval(fetchData, 10 * 1000);
  }, []);

  return (
    <>
      <Navbar />
      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8 text-gray-900">
        <div className="border-b border-gray-200 pb-5">
          <h3 className="text-base font-semibold text-gray-900">
            All events Predict and Win
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-y-4 md:grid-cols-3 mt-12 gap-x-4">
          {events.map((data, index) => {
            return (
              <div
                key={index}
                className="overflow-hidden rounded-lg bg-white shadow"
                onClick={() => {
                  router.push(
                    "/events/" +
                      encodeURIComponent(data.event) +
                      `?endTime=${data.endTime}`
                  );
                }}
              >
                <div className="flex justify-between p-4">
                  <div className="flex">
                    <Image
                      src="/event-trader-count-logo.avif"
                      alt="test"
                      width={20}
                      height={20}
                    />
                    <span className="flex flex-col pl-1 self-end text-xs">
                      2048 traders
                    </span>
                  </div>
                  <div className="text-sm flex justify-end">
                    {data.timeLeft}
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">{data.event}</div>
                <div className="flex p-4 gap-x-3">
                  <button
                    type="button"
                    className="w-full rounded bg-sky-50 px-2 py-1 text-sm font-semibold text-blue-600 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Yes ₹ {data.yesPrice}
                  </button>
                  <button
                    type="button"
                    className="w-full rounded bg-red-50 px-2 py-1 text-sm font-semibold text-red-500 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    No ₹ {data.noPrice}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
