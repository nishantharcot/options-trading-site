"use client";

/* eslint-disable react-hooks/exhaustive-deps */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useContext, useEffect, useState } from "react";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { UserContext, UserContextType } from "@/context/UserContext";

export default function LandingScreen() {
  const router = useRouter();

  console.log("process.env check:- ", process.env);

  const API_URL = "https://optixchanges.com/api";

  const [isError] = useState(false);

  const [currentText, setCurrentText] = useState("Not a member?");
  const [currentMode, setCurrentMode] = useState("Sign in");
  const [oppMode, setOppMode] = useState("Sign up");

  const { setUserId }: UserContextType = useContext(UserContext);

  const userIdSubmission = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const userId = formData.get("userId")?.toString();
    const password = formData.get("password")?.toString();

    console.log("userId:- ", userId);
    console.log("password:- ", password);

    if (currentMode === "Sign up") {
      fetch(`${API_URL}/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, userId }),
      })
        .then((res) => res.json())
        .then((finalRes) => {
          if (userId) {
            setUserId(userId);
          }

          console.log("finalRes:- ", finalRes);
          router.push("/events");
        });
    } else {
      fetch(`${API_URL}/signin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, userId }),
      })
        .then((res) => res.json())
        .then((finalRes) => {
          console.log("final user Id:- ", userId);
          if (userId) {
            setUserId(userId);
          }
          console.log("finalRes:- ", finalRes);
          router.push("/events");
        });
    }
  };

  useEffect(() => {
    fetch(API_URL + "/check-auth", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("auth check data:- ", data);
        if (data.authenticated) {
          setUserId(data.user.userId);
          router.replace("/events");
        }
      });
  }, []);

  return (
    <div className="bg-white flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <Image
              src="/optixchange-logo.png"
              alt="test"
              height={200}
              width={200}
            />
          </div>

          <div className="mt-10">
            <div>
              <form
                onSubmit={(e) => userIdSubmission(e)}
                method="POST"
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="userId"
                    className="block text-sm/6 font-medium text-gray-900"
                  >
                    User Id
                  </label>
                  <div className="mt-2">
                    <input
                      id="userId"
                      name="userId"
                      type="text"
                      required
                      autoComplete="text"
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm/6 font-medium text-gray-900"
                    >
                      Password
                    </label>
                  </div>
                  <div className="mt-2">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>
                {isError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="shrink-0">
                        <XCircleIcon
                          aria-hidden="true"
                          className="size-5 text-red-400"
                        />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          User Id already exists! Please choose a new one
                        </h3>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {currentMode}
                  </button>
                </div>
              </form>

              <p className="text-center text-sm/6 mt-4 text-gray-500">
                {currentText}{" "}
                <button
                  onClick={() => {
                    if (currentText === "Not a member?") {
                      setCurrentText("Already a member?");
                      setOppMode("Sign in");
                      setCurrentMode("Sign up");
                    } else {
                      setCurrentText("Not a member?");
                      setOppMode("Sign up");
                      setCurrentMode("Sign in");
                    }
                  }}
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  {oppMode}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <Image src="/login-screen-banner-image.jpeg" alt="test" layout="fill" />
      </div>
    </div>
  );
}
