"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EventDetails = {
  event: string;
  yesPrice: number;
  noPrice: number;
};

export default function EventsScreen() {
  const [events, setEvents] = useState<EventDetails[]>([]);

  const router = useRouter();

  console.log("events check:- ", events);

  useEffect(() => {
    fetch("http://localhost:3000/orderbook")
      .then((res) => res.json())
      .then((finalRes) => {
        const events: EventDetails[] = [];

        if (!finalRes) {
          return;
        }

        finalRes.forEach((data: any) => {
          console.log("data check:- ", data);
          const eventName = data[0];
          let yP = 10,
            nP = 10;

          if (data[1].hasOwnProperty("no") && data[1].hasOwnProperty("yes")) {
            const noData = Object.entries(data[1].no);
            noData.forEach((data) => {
              nP = Math.min(nP, Number(data[0][0]));
            });

            const yesData = Object.entries(data[1].yes);
            yesData.forEach((data) => {
              yP = Math.min(yP, Number(data[0][0]));
            });

            events.push({
              event: eventName,
              yesPrice: yP,
              noPrice: nP,
            });
          }
        });

        setEvents(events);
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
        <div className="grid grid-cols-3 mt-12 gap-x-4">
          {events.map((data, index) => {
            return (
              <div
                key={index}
                className="overflow-hidden rounded-lg bg-white shadow"
                onClick={() =>
                  router.push("/events/" + encodeURIComponent(data.event))
                }
              >
                <div className="px-4 py-5 sm:p-6">{data.event}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
