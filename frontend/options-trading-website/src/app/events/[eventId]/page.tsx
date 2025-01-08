"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EventDetailsScreen() {
  const { eventId } = useParams();

  console.log("eventId:- ", eventId);

  const decodedEventId = decodeURIComponent(eventId);

  useEffect(() => {
    async function getEventData() {
      try {
        const res = await fetch(`http://localhost:3000/orderbook/${eventId}`);
        const res2 = await res.json();

        console.log("res2:- ", res2);
      } catch (e) {
        console.log("error:- ", e);
      }
    }
    getEventData();
  }, [eventId]);

  return (
    <>
      <Navbar />
      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8 text-gray-900">
        <div className="border-b border-gray-200 pb-5">
          <h3 className="text-base font-semibold text-gray-900">
            {decodedEventId}
          </h3>
        </div>
      </div>
    </>
  );
}
