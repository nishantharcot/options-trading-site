"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { XCircleIcon } from "@heroicons/react/20/solid";

export default function LandingScreen() {
  const router = useRouter();

  const [isError, setIsError] = useState(false);

  const userIdSubmission = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const userId = formData.get("text");

    console.log("User Id:", userId);

    fetch(`http://localhost:3000/user/create/${userId}`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then((finalRes) => {
        if (finalRes.message === "User already exists") {
          setIsError(true);
        } else {
          router.push("/events");
        }
      });
  };

  return (
    <div className="bg-white flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            {/* <img
              alt="Your Company"
              src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600"
              className="h-10 w-auto"
            /> */}
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
                      // fetch("http://localhost:3000/user/create");
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
        {/* <img
          alt=""
          src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
          className="absolute inset-0 size-full object-cover"
        /> */}
        <Image src="/login-screen-banner-image.jpeg" alt="test" layout="fill" />
      </div>
    </div>
  );
}
