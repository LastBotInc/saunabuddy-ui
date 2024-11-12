"use client";

import { useCloud } from "@/cloud/useCloud";
import React, { createContext, useState } from "react";
import { useCallback } from "react";
import { useConfig } from "./useConfig";

export type ConnectionMode = "cloud" | "manual" | "env";

type TokenGeneratorData = {
  shouldConnect: boolean;
  wsUrl: string;
  token: string;
  mode: ConnectionMode;
  disconnect: () => Promise<void>;
  connect: (
    mode: ConnectionMode,
    opts?: { language?: string }
  ) => Promise<void>;
};

const ConnectionContext = createContext<TokenGeneratorData | undefined>(
  undefined
);

export const ConnectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { generateToken, wsUrl: cloudWSUrl } = useCloud();
  const { config } = useConfig();
  const [connectionDetails, setConnectionDetails] = useState<{
    wsUrl: string;
    token: string;
    mode: ConnectionMode;
    shouldConnect: boolean;
  }>({ wsUrl: "", token: "", shouldConnect: false, mode: "manual" });

  const disconnect = useCallback(async () => {
    setConnectionDetails((prev) => ({ ...prev, shouldConnect: false }));
  }, []);

  const connect = useCallback(
    async (
      mode: ConnectionMode,
      opts?: { language?: string; serverUrl?: string }
    ) => {
      console.log("Connect called with mode:", mode, "and opts:", opts);
      let token = "";
      let url = opts?.serverUrl || "";
      if (mode === "cloud") {
        token = await generateToken();
        url = cloudWSUrl;
      } else if (mode === "env") {
        if (!process.env.NEXT_PUBLIC_LIVEKIT_URL) {
          throw new Error("NEXT_PUBLIC_LIVEKIT_URL is not set");
        }

        if (!url) {
          throw new Error("NEXT_PUBLIC_SERVER_URL is not set");
        }
        const uuid = Math.random().toString(36).substring(4);
        const serverUrl = new URL(url);
        serverUrl.searchParams.append("uuid", uuid);
        if (opts?.language) {
          serverUrl.searchParams.append("language", opts.language);
        }
        console.log("Server URL with params:", serverUrl.toString());
        const response = await fetch(serverUrl.toString());
        const data = await response.json();
        token = data.token;
        url = data.url;
      } else {
        token = config.settings.token;
        url = config.settings.ws_url;
      }
      console.log("Connecting with URL:", url, "and token:", token);
      setConnectionDetails({ wsUrl: url, token, shouldConnect: true, mode });
    },
    [cloudWSUrl, config.settings.token, config.settings.ws_url, generateToken]
  );

  return (
    <ConnectionContext.Provider
      value={{
        wsUrl: connectionDetails.wsUrl,
        token: connectionDetails.token,
        shouldConnect: connectionDetails.shouldConnect,
        mode: connectionDetails.mode,
        connect,
        disconnect,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = React.useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
};
