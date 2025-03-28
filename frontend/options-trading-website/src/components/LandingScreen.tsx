"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useContext, useState } from "react";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { UserContext, UserContextType } from "@/context/UserContext";

export default function LandingScreen() {
  const router = useRouter();

  const API_URL = "http://139.59.51.208:3000";

  console.log("API_URL check:- ", API_URL);

  const [isError] = useState(false);

  const { setUserId }: UserContextType = useContext(UserContext);

  const userIdSubmission = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const userId = formData.get("text")?.toString();

    console.log("checking if latest!!!");
    console.log("API_URL check:- ", API_URL);

    fetch(`${API_URL}/user/create/${userId}`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then(() => {
        if (userId) {
          if (typeof window !== "undefined") {
            localStorage.setItem("userId", userId);
            setUserId(userId);
          }
        }
        router.push("/events");
      });
  };

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
                    htmlFor="text"
                    className="block text-sm/6 font-medium text-gray-900"
                  >
                    User Id
                  </label>
                  <div className="mt-2">
                    <input
                      id="text"
                      name="text"
                      type="text"
                      required
                      autoComplete="text"
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
                    onClick={() => {
                      // fetch("${API_URL}/user/create");
                      // router.push("/events");
                    }}
                  >
                    Submit
                  </button>
                </div>
              </form>
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
