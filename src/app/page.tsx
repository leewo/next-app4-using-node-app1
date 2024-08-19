"use client";

import { useState, useEffect } from "react";

export default function HomePage() {
  const [message, setMessage] = useState("");
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("http://localhost:3001/api/v1/user",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include'
          }
        );
        const data = await response.json();
        if (data) {
          setMessage(`Welcome ${data.user.USER_NAME}`);
          setAuth(true);
        }
      } catch (error: unknown) {
        setAuth(false);
        setMessage("You are not logged in");
      }
    }
    )();
  }, []);

  return (
    <>
      {message}
    </>
  );
}
