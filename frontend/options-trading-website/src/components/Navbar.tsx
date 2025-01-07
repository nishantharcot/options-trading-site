"use client";

import Image from "next/image";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/20/solid";
import { MinusIcon } from "@heroicons/react/20/solid";
import { WalletIcon } from "@heroicons/react/20/solid";
import { CurrencyRupeeIcon } from "@heroicons/react/20/solid";
import { FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

type EventDetails = {
  event: string;
  yesPrice: number;
  noPrice: number;
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [mintTokensOpen, setmintTokensOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [refetch, setRefetch] = useState(true);

  const [mintEventSelected, setmintEventSelected] = useState("");

  const [mintPrice, setmintPrice] = useState<number>(3.5);
  const [mintNumberOfTokens, setmintNumberOfTokens] = useState<number>();

  const userId = localStorage.getItem("userId");
  const [events, setEvents] = useState<EventDetails[]>([]);

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
        // console.log("events check:- ", events);
      });
  }, []);

  const handleNumberOfTokens = (e: React.ChangeEvent<HTMLInputElement>) => {
    setmintNumberOfTokens(Number(e.target.value));
    console.log("mintNumberOfTokens:- ", mintNumberOfTokens);
  };

  const addFundClick = () => {
    setOpen(true);
  };

  const mintTokensClick = () => {
    setmintTokensOpen(true);
  };

  const mintTokens = async () => {
    console.log("he;;");

    const tempRes = await fetch("http://localhost:3000/trade/mint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        stockSymbol: mintEventSelected,
        quantity: mintNumberOfTokens,
        price: mintPrice * 100,
      }),
    });

    const res = await tempRes.json();

    console.log("res check:- ", res);
    setRefetch(!refetch);
  };

  const addFund = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const amount = Number(formData.get("text"));

    if (!Number.isNaN(amount)) {
      fetch("http://localhost:3000/onramp/inr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          amount: amount * 100,
        }),
      })
        .then((res) => res.json())
        .then((finalRes) => {
          console.log(finalRes);
          setRefetch(!refetch);
        });
    }

    console.log("amount:- ", amount);
  };

  const createEventClick = () => {
    setEventOpen(true);
  };

  const createEvent = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const event = formData.get("text")?.toString();

    if (event) {
      fetch(`http://localhost:3000/symbol/create/${event}`, { method: "POST" })
        .then((res) => res.json())
        .then((finalRes) => {
          console.log("event check:- ", finalRes);
        });
    }
  };

  useEffect(() => {
    if (userId) {
      fetch(`http://localhost:3000/balances/inr/${userId}`)
        .then((res) => res.json())
        .then((finalRes) => {
          const paise = Number(finalRes.message);
          const rup = paise / 100;
          setAmount(rup);
        });
    }
  }, [userId, refetch]);

  return (
    <Disclosure as="nav" className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="-ml-2 mr-2 flex items-center md:hidden">
              {/* Mobile menu button */}
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                <Bars3Icon
                  aria-hidden="true"
                  className="block size-6 group-data-[open]:hidden"
                />
                <XMarkIcon
                  aria-hidden="true"
                  className="hidden size-6 group-data-[open]:block"
                />
              </DisclosureButton>
            </div>
            <div className="flex shrink-0 items-center">
              <Image
                src="/optixchange-logo.png"
                alt="test"
                width={200}
                height={200}
              />
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <div className="flex items-center">
                <form onSubmit={(e) => createEvent(e)}>
                  <button
                    type="submit"
                    onClick={createEventClick}
                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-900"
                  >
                    Create an Event
                  </button>
                </form>
              </div>
              <div className="flex items-center">
                <button
                  type="submit"
                  onClick={mintTokensClick}
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Mint Tokens
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="shrink-0">
              <button
                type="button"
                className="relative inline-flex items-center gap-x-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={addFundClick}
              >
                <WalletIcon aria-hidden="true" className="-ml-0.5 size-5" />
                <div className="flex items-center gap-x-2">
                  <CurrencyRupeeIcon
                    aria-hidden="true"
                    className="-ml-0.5 size-4"
                  />
                  <span>{amount}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <DisclosurePanel className="md:hidden">
        <div className="space-y-1 pb-3 pt-2">
          {/* Current: "bg-indigo-50 border-indigo-500 text-indigo-700", Default: "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700" */}
          <DisclosureButton
            as="a"
            href="#"
            className="block border-l-4 border-indigo-500 bg-indigo-50 py-2 pl-3 pr-4 text-base font-medium text-indigo-700 sm:pl-5 sm:pr-6"
          >
            <form onSubmit={(e) => createEvent(e)}>
              <button
                type="submit"
                onClick={createEventClick}
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Create an Event
              </button>
            </form>
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="#"
            className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 sm:pl-5 sm:pr-6"
          >
            <button
              type="submit"
              onClick={mintTokensClick}
              className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-900"
            >
              Mint Tokens
            </button>
          </DisclosureButton>
        </div>
      </DisclosurePanel>

      {/* Add Money modal */}
      <Dialog open={open} onClose={setOpen} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-sm sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
            >
              <form onSubmit={(e) => addFund(e)}>
                <label
                  htmlFor="text"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Money (in Rupees)
                </label>
                <div className="mt-2">
                  <input
                    id="text"
                    name="text"
                    type="text"
                    placeholder="500"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Recharge
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Create Event Modal */}
      <Dialog open={eventOpen} onClose={setEventOpen} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-sm sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
            >
              <form onSubmit={(e) => createEvent(e)}>
                <label
                  htmlFor="text"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Event Name
                </label>
                <div className="mt-2">
                  <input
                    id="text"
                    name="text"
                    type="text"
                    placeholder="Liverpool to win against Manchester United?"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Mint Tokens Modal */}
      <Dialog
        open={mintTokensOpen}
        onClose={setmintTokensOpen}
        className="relative z-10"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-sm sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
            >
              <div>
                <label
                  htmlFor="event"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Select Event
                </label>
                <div className="mt-2 grid grid-cols-1">
                  <select
                    id="event"
                    name="event"
                    className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  >
                    {events.map((event, index) => {
                      return (
                        <option
                          onClick={() => setmintEventSelected(event.event)}
                          key={index}
                        >
                          {event.event}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                  />
                </div>
              </div>

              <div className="mt-2">
                <div>
                  <label
                    htmlFor="event"
                    className="block text-sm/6 font-medium text-gray-900"
                  >
                    Set Price
                  </label>
                  <div className="mt-2">
                    <div className="flex gap-x-6">
                      <button
                        type="button"
                        onClick={() => setmintPrice(mintPrice - 0.5)}
                        className="rounded-full bg-indigo-600 p-1 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <MinusIcon aria-hidden="true" className="size-5" />
                      </button>
                      <div className="text-black w-[10px]">{mintPrice}</div>
                      <button
                        type="button"
                        onClick={() => setmintPrice(mintPrice + 0.5)}
                        className="rounded-full bg-indigo-600 p-1 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <PlusIcon aria-hidden="true" className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <label
                    htmlFor="token_count"
                    className="block text-sm/6 font-medium text-gray-900"
                  >
                    Number of tokens
                  </label>
                  <div className="mt-2">
                    <input
                      id="token_count"
                      name="text"
                      onChange={handleNumberOfTokens}
                      type="text"
                      placeholder="20"
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <div className="mt-5 sm:mt-6">
                  <button
                    onClick={mintTokens}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Disclosure>
  );
}
