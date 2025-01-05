"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";

type EventDetails = {
  event: string;
  yesPrice: number;
  noPrice: number;
};

export default function EventsScreen() {
  const [events, setEvents] = useState<EventDetails[]>([]);

  useEffect(() => {
    fetch("http://localhost:3000/orderbook")
      .then((res) => res.json())
      .then((finalRes) => {
        const events: EventDetails[] = [];

        finalRes.forEach((data) => {
          const eventName = data[0];
          let yP = 10,
            nP = 10;

          const noData = Object.entries(data[1].no);
          const yesData = Object.entries(data[1].yes);

          noData.forEach((data) => {
            nP = Math.min(nP, Number(data[0][0]));
          });

          yesData.forEach((data) => {
            yP = Math.min(yP, Number(data[0][0]));
          });

          events.push({
            event: eventName,
            yesPrice: yP,
            noPrice: nP,
          });
        });

        setEvents(events);
        console.log("events check:- ", events);
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
        {events.map((data, index) => {
          return <div key={index}>{data.event}</div>;
        })}
      </div>
    </>
  );
}
