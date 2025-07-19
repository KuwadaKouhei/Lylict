"use client"

import { type FC } from "react";
import { useState, useEffect } from "react"

const Home: FC = () => {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchMessage = async () => {
      const response = await fetch('/api/hello');
      const data = await response.json();
      console.log("data", data);
      setMessage(data.message);
    };

    fetchMessage();
  }, []);
  return (
    <div className="">
      <div className="text-lg font-bold">Home</div>
      <div className="text-sm">This is a Next.js app with TypeScript.</div>
      <div className="text-sm">The message from the API is:</div>
      <div className="text-sm">{message}</div>
      <div>
      </div>
    </div>
  );
};

export default Home;