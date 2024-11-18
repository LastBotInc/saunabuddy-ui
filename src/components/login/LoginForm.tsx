import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { track } from "@vercel/analytics";
import { isValidEmail } from "@/lib/util";

export default function Login({
  onAuthenticated,
}: {
  onAuthenticated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to verify the session by making a request to the server
    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Body is empty
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Invalid session, please log in again");
        }
      })
      .then((data) => {
        const { message, email } = data;
        track("Login", {
          userName: email,
          timestamp: new Date().toISOString(),
        });
        onAuthenticated();
      })
      .catch((error) => {
        console.error("Error:", error);
        setError("");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [onAuthenticated]);

  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

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
        track("Login", {
          userName: email,
          timestamp: new Date().toISOString(),
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
      <Analytics />
      {loading ? (
        <div className="text-white">Loading...</div>
      ) : (
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
            className="w-full p-3 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition duration-300"
          >
            Login
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          <div className="mt-5">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSdh1AUrn2pDBcyRMgWpCj8G90DiGwov5wbcSZ6RRQneQowN_g/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              Request access to the SaunaBuddy beta
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
