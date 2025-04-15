"use client";

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import Navbar from "@/components/Navbar";
import { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  XMarkIcon,
  XCircleIcon,
} from "@heroicons/react/16/solid";
import { MinusIcon } from "@heroicons/react/16/solid";
import { PlusIcon } from "@heroicons/react/16/solid";
import { UserContext, UserContextType } from "@/context/UserContext";
import { SignalingManager } from "@/utils/SignalingManager";
import { OrderType } from "@/app/types";
import { sortByPrice } from "@/utils/helperFunctions";
import { Transition } from "@headlessui/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { API_URL } from "@/config";

type orderbookData = {
  price: number;
  quantity: number;
};

export default function EventDetailsScreen() {
  const { eventId }: { eventId: string } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [endTime] = useState(searchParams.get("endTime"));
  const [timeLeft, setTimeLeft] = useState("");

  const [refetch, setRefetch] = useState(true);

  const { userId } = useContext(UserContext);
  const decodedEventId = decodeURIComponent(eventId);

  const [noData, setNoData] = useState<orderbookData[]>();
  const [yesData, setYesData] = useState<orderbookData[]>();

  const [yesTotalQuantity, setYesTotalQuantity] = useState(0);
  const [noTotalQuantity, setNoTotalQuantity] = useState(0);

  const orderTypes = ["Buy", "Sell"];

  const [orderType, setOrderType] = useState("Buy");
  const [stockType, setStockType] = useState("no");

  const [showNotification, setshowNotification] = useState(false);
  const [notificationContent, setNotificationContent] = useState("");
  const [notificationSuccess, setnotificationSuccess] = useState(true);

  const { setUserBalance }: UserContextType = useContext(UserContext);

  useEffect(() => {
    if (!endTime) {
      return;
    }
    const interval = setInterval(() => {
      const diff = new Date(endTime).getTime() - new Date().getTime();

      if (diff > 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft("Event ended");
        router.push("/events");
      }
    }, 1000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [endTime]);

  useEffect(() => {
    if (userId) {
      fetch(`${API_URL}/balances/inr/${userId}`)
        .then((res) => res.json())
        .then((finalRes) => {
          const paise = Number(finalRes.message);
          const rup = paise / 100;
          setUserBalance(rup);
        });
    }
  }, [userId, refetch]);

  const placeOrder = () => {
    async function order() {
      const res = await fetch(`${API_URL}/order/${orderType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: userId,
          stockSymbol: encodeURIComponent(decodedEventId),
          quantity: quantity,
          price: price * 100,
          stockType: stockType,
        }),
      });

      const res2 = await res.json();

      setRefetch(!refetch);
      setshowNotification(true);
      setNotificationContent(res2.message);
      if (res2.message.includes("Insufficient")) {
        setnotificationSuccess(false);
      } else {
        setnotificationSuccess(true);
      }
    }

    order();
  };

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }

  const initialTabs = [
    { name: "Yes", href: "#", current: false },
    { name: "No", href: "#", current: true },
  ];

  const [tabs, setTabs] = useState(initialTabs);

  const handleTabClick = (clickedTabName: string) => {
    setStockType(clickedTabName.toLowerCase());
    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        current: tab.name === clickedTabName,
      }))
    );
  };

  useEffect(() => {
    async function getEventData() {
      try {
        const res = await fetch(`${API_URL}/orderbook/${eventId}`);
        const res2 = await res.json();

        const noDataArr: orderbookData[] = [];
        const yesDataArr: orderbookData[] = [];

        let noTotal = 0;
        let yesTotal = 0;

        Object.entries(res2[0].no).forEach((data: any[]) => {
          noDataArr.push({
            price: Number(data[0]),
            quantity: Number(data[1].total),
          });
          noTotal += Number(data[1].total);
        });

        Object.entries(res2[0].yes).forEach((data: any[]) => {
          yesDataArr.push({
            price: Number(data[0]),
            quantity: Number(data[1].total),
          });
          yesTotal += Number(data[1].total);
        });

        setYesTotalQuantity(yesTotal);
        setNoTotalQuantity(noTotal);
        setNoData(sortByPrice(noDataArr));
        setYesData(sortByPrice(yesDataArr));
      } catch (e) {
        console.log("error:- ", e);
      }
    }
    getEventData();

    SignalingManager.getInstance().registerCallback(
      decodedEventId,
      (data: OrderType) => {
        const orderbook = data;
        const yesArray = [];
        const noArray = [];

        let noTotal = 0;
        let yesTotal = 0;

        for (const stockType of ["yes", "no"] as const) {
          if (!orderbook[stockType]) {
            continue;
          }
          const orderPrice = orderbook[stockType];
          let id = 1;

          if (orderPrice) {
            for (const price in orderPrice) {
              const orderDetails = orderPrice[price];
              const total = orderDetails.total;

              if (stockType == "yes") {
                yesTotal += total;
                yesArray.push({ id, price: Number(price), quantity: total });
                id++;
              } else {
                noTotal += total;
                noArray.push({ id, price: Number(price), quantity: total });
                id++;
              }
            }
          }
        }

        setYesTotalQuantity(yesTotal);
        setNoTotalQuantity(noTotal);
        setYesData(sortByPrice(yesArray));
        setNoData(sortByPrice(noArray));
      }
    );
    SignalingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [decodedEventId],
    });

    return () => {
      SignalingManager.getInstance().deRegisterCallback(decodedEventId);
      SignalingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [decodedEventId],
      });
    };
  }, [eventId]);

  const [price, setPrice] = useState(8);
  const [quantity, setQuantity] = useState(1);

  return (
    <>
      <Navbar />
      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8 text-gray-900">
        <div className="flex justify-between border-b border-gray-200 pb-5">
          <h3 className="text-base font-semibold text-gray-900">
            {decodedEventId}
          </h3>
          <div>Ends in {timeLeft}</div>
        </div>
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="flex">
                  <div className="inline-block py-2 align-middle sm:px-6 lg:px-8">
                    {yesData && (
                      <table className=" divide-y divide-gray-300">
                        <thead>
                          <tr>
                            <th
                              scope="col"
                              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                            >
                              Price
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              QTY AT
                              <span className="pl-1 text-blue-700">YES</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {yesData.map((data, index) => (
                            <tr key={index}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                {data.price}
                              </td>

                              <td className="relative whitespace-nowrap text-end px-3 py-4 text-sm text-gray-500">
                                <span
                                  className="absolute top-0 bottom-0 right-0 bg-blue-200"
                                  style={{
                                    width: `${
                                      25 +
                                      (data.quantity * 100) / yesTotalQuantity
                                    }%`,
                                  }}
                                ></span>
                                <span className="relative z-10">
                                  {data.quantity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div className="inline-block py-2 align-middle sm:px-6 lg:px-8">
                    {noData && (
                      <table className=" divide-y divide-gray-300">
                        <thead>
                          <tr>
                            <th
                              scope="col"
                              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                            >
                              Price
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              QTY AT
                              <span className="pl-1 text-red-700">NO</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {noData.map((data, index) => (
                            <tr key={index}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                {data.price}
                              </td>
                              <td className="relative whitespace-nowrap text-end px-3 py-4 text-sm text-gray-500">
                                <span
                                  className="absolute top-0 bottom-0 right-0 bg-red-200"
                                  style={{
                                    width: `${
                                      25 +
                                      (data.quantity * 100) / noTotalQuantity
                                    }%`,
                                  }}
                                ></span>
                                <span className="relative z-10">
                                  {data.quantity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="min-w-[300px]">
            <div className="divide-y mt-8 divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:px-6">
                {/* Content goes here */}

                {/* We use less vertical padding on card headers on desktop than on body sections */}
                <div>
                  <div className="grid grid-cols-1 sm:hidden">
                    {tabs && (
                      <select
                        defaultValue={
                          tabs.find((tab) => tab.current)
                            ? tabs.find((tab) => tab.current)?.name
                            : ""
                        }
                        aria-label="Select a tab"
                        onChange={(e) => handleTabClick(e.target.value)}
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                      >
                        {tabs.map((tab) => (
                          <option key={tab.name}>{tab.name}</option>
                        ))}
                      </select>
                    )}
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <nav
                      aria-label="Tabs"
                      className="isolate flex divide-x divide-gray-200 rounded-lg shadow"
                    >
                      {tabs.map((tab, tabIdx) => (
                        <a
                          key={tab.name}
                          href={tab.href}
                          aria-current={tab.current ? "page" : undefined}
                          onClick={() => handleTabClick(tab.name)}
                          className={classNames(
                            tab.current
                              ? "text-gray-900"
                              : "text-gray-500 hover:text-gray-700",
                            tabIdx === 0 ? "rounded-l-lg" : "",
                            tabIdx === tabs.length - 1 ? "rounded-r-lg" : "",
                            "group relative min-w-0 flex-1 overflow-hidden bg-white px-4 py-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10"
                          )}
                        >
                          <span>{tab.name}</span>
                          <span
                            aria-hidden="true"
                            className={classNames(
                              tab.current ? "bg-indigo-500" : "bg-transparent",
                              "absolute inset-x-0 bottom-0 h-0.5"
                            )}
                          />
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {/* Content goes here */}
                <div className="flex flex-col border-1 border-gray-1">
                  <div className="flex border-2 justify-between">
                    <div className="pl-2">Price</div>
                    <div className="flex justify-around min-w-[150px]">
                      <button>
                        <MinusIcon
                          onClick={() => setPrice(price - 0.5)}
                          aria-hidden="true"
                          className=" size-6"
                        />
                      </button>
                      <div>{price}</div>
                      <button>
                        {/* PlusIcon */}
                        <PlusIcon
                          onClick={() => setPrice(price + 0.5)}
                          aria-hidden="true"
                          className=" size-6"
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex border-2 border-t-0 justify-between">
                    <div className="pl-2">Quantity</div>
                    <div className="flex justify-around min-w-[150px]">
                      <button>
                        <MinusIcon
                          onClick={() => setQuantity(quantity - 1)}
                          aria-hidden="true"
                          className=" size-6"
                        />
                      </button>
                      <div>{quantity}</div>
                      <button>
                        {/* PlusIcon */}
                        <PlusIcon
                          onClick={() => setQuantity(quantity + 1)}
                          aria-hidden="true"
                          className=" size-6"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ordertype"
                    className="block text-sm/6 font-medium text-gray-900 mt-4"
                  >
                    Order Type
                  </label>
                  <div className="mt-2 grid grid-cols-1">
                    <select
                      id="ordertype"
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      name="ordertype"
                      className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    >
                      {orderTypes.map((orderType, index) => {
                        return <option key={index}>{orderType}</option>;
                      })}
                    </select>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 sm:px-6 w-full">
                {/* Content goes here */}
                {/* We use less vertical padding on card footers at all sizes than on headers or body sections */}
                <button
                  type="button"
                  className="relative w-full text-center items-center gap-x-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  onClick={placeOrder}
                >
                  Place Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
          <Transition show={showNotification}>
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5 transition data-[closed]:data-[enter]:translate-y-2 data-[enter]:transform data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:data-[enter]:sm:translate-x-2 data-[closed]:data-[enter]:sm:translate-y-0">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="shrink-0">
                    {notificationSuccess ? (
                      <CheckCircleIcon
                        aria-hidden="true"
                        className="size-6 text-green-400"
                      />
                    ) : (
                      <XCircleIcon
                        aria-hidden="true"
                        className="size-6 text-red-400"
                      />
                    )}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">
                      {notificationContent}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setshowNotification(false);
                      }}
                      className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon aria-hidden="true" className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  );
}
