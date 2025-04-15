"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

import Navbar from "@/components/Navbar";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserContext, UserContextType } from "@/context/UserContext";
import { API_URL } from "@/config";
import { EventDetails, useStockEvents } from "@/utils/useStockEvents";

export default function EventsScreen() {
  const rawEvents = useStockEvents();
  const [events, setEvents] = useState<EventDetails[]>([]);
  const { setUserId }: UserContextType = useContext(UserContext);

  const router = useRouter();

  useEffect(() => {
    setEvents(rawEvents);

    console.log("events check in main page:- ", rawEvents);
    const interval = setInterval(() => {
      setEvents((rawEvents) =>
        rawEvents.filter((data) => {
          const diff = new Date(data.endTime).getTime() - Date.now();
          if (diff > 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            data.timeLeft = `${minutes}m ${seconds}s`;
            return data;
          }
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [rawEvents]);

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
