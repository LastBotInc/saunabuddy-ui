import { useState, useEffect } from "react";
import { track } from "@vercel/analytics";

export default function Login({
  onAuthenticated,
}: {
  onAuthenticated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const authExpiration = localStorage.getItem("authExpiration");
    if (authExpiration) {
      const currentTime = new Date().getTime();
      const expirationTime = parseInt(authExpiration, 10);
      if (currentTime < expirationTime) {
        track("Login", {
          userName: "existing user",
          timestamp: new Date().toISOString(),
          expirationTime,
        });
        onAuthenticated();
      } else {
        localStorage.removeItem("authExpiration");
      }
    }
  }, [onAuthenticated]);

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const expirationTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour from now
        localStorage.setItem("authExpiration", expirationTime.toString());
        track("Login", {
          userName: email,
          timestamp: new Date().toISOString(),
          expirationTime,
        });
        onAuthenticated();
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred during login");
    }
  };

  return (
    <div
      className="flex justify-center items-center h-screen bg-gray-100"
      style={{
        backgroundImage: "url('/saunabuddy.png')",
        backgroundSize: "cover",
        objectFit: "cover",
      }}
    >
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Login To SaunaBuddy
        </h1>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleLogin}
          className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
        >
          Login
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}
