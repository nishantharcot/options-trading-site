"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { MinusIcon } from "@heroicons/react/16/solid";
import { PlusIcon } from "@heroicons/react/16/solid";

type orderbookData = {
  price: number;
  quantity: number;
};

export default function EventDetailsScreen() {
  const { eventId }: { eventId: string } = useParams();

  const userId = localStorage.getItem("userId");
  const decodedEventId = decodeURIComponent(eventId);

  const [noData, setNoData] = useState<orderbookData[]>();
  const [yesData, setYesData] = useState<orderbookData[]>();

  const orderTypes = ["Buy", "Sell"];

  const [orderType, setOrderType] = useState("Buy");
  const [stockType, setStockType] = useState("no");

  console.log("orderType check:- ", orderType);

  const placeOrder = () => {
    async function order() {
      console.log("price:- ", price);
      console.log("quantity:- ", quantity);
      console.log("userId:- ", localStorage.getItem("userId"));
      console.log("order type:- ", orderType);
      console.log("stock type:- ", stockType);

      const res = await fetch(`http://localhost:3000/order/${orderType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          stockSymbol: decodedEventId,
          quantity: quantity,
          price: price * 100,
          stockType: stockType,
        }),
      });

      const res2 = await res.json();

      console.log("res2:- ", res2);
    }

    order();
  };

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  const initialTabs = [
    { name: "Yes", href: "#", current: false },
    { name: "No", href: "#", current: true },
  ];

  const [tabs, setTabs] = useState(initialTabs);

  const handleTabClick = (clickedTabName) => {
    console.log("clickedTabName:- ", clickedTabName);
    setStockType(clickedTabName);
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
        const res = await fetch(`http://localhost:3000/orderbook/${eventId}`);
        const res2 = await res.json();

        const noDataArr: orderbookData[] = [];
        const yesDataArr: orderbookData[] = [];

        Object.entries(res2[0].no).forEach((data) => {
          console.log("data check 0:- ", data[0]);
          console.log("data check 1:- ", data[1].total);
          noDataArr.push({
            price: Number(data[0]),
            quantity: Number(data[1].total),
          });
        });

        Object.entries(res2[0].yes).forEach((data) => {
          console.log("data check 0:- ", data[0]);
          console.log("data check 1:- ", data[1].total);
          yesDataArr.push({
            price: Number(data[0]),
            quantity: Number(data[1].total),
          });
        });

        setNoData(noDataArr);
        setYesData(yesDataArr);
      } catch (e) {
        console.log("error:- ", e);
      }
    }
    getEventData();
  }, [eventId]);

  const [price, setPrice] = useState(8);
  const [quantity, setQuantity] = useState(1);

  return (
    <>
      <Navbar />
      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8 text-gray-900">
        <div className="border-b border-gray-200 pb-5">
          <h3 className="text-base font-semibold text-gray-900">
            {decodedEventId}
          </h3>
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
                              <td className="whitespace-nowrap text-end px-3 py-4 text-sm text-gray-500">
                                {data.quantity}
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
                              <td className="whitespace-nowrap text-end px-3 py-4 text-sm text-gray-500">
                                {data.quantity}
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
                    {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
                    <select
                      defaultValue={tabs.find((tab) => tab.current).name}
                      aria-label="Select a tab"
                      onChange={(e) => handleTabClick(e.target.value)}
                      className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    >
                      {tabs.map((tab) => (
                        <option key={tab.name}>{tab.name}</option>
                      ))}
                    </select>
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
                <div className="flex flex-col border-2 border-gray-2">
                  <div className="flex border-2 justify-between">
                    <div>Price</div>
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
                  <div className="flex border-2 justify-between">
                    <div>Quantity</div>
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
    </>
  );
}
