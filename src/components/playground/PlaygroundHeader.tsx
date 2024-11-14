import { Button } from "@/components/button/Button";
import { LoadingSVG } from "@/components/button/LoadingSVG";
import { PlaygroundDeviceSelector } from "@/components/playground/PlaygroundDeviceSelector";
import { getSessionPeriod } from "@/lib/util";

import { useConfig } from "@/hooks/useConfig";
import { ConnectionState } from "livekit-client";
import { ReactNode } from "react";
import { track } from "@vercel/analytics";

type PlaygroundHeader = {
  logo?: ReactNode;
  title?: ReactNode;
  githubLink?: string;
  height: number;
  accentColor: string;
  connectionState: ConnectionState;
  onConnectClicked: () => void;
};

export const PlaygroundHeader = ({
  logo,
  title,
  githubLink,
  accentColor,
  height,
  onConnectClicked,
  connectionState,
}: PlaygroundHeader) => {
  const { config } = useConfig();

  const logSessionDuration = () => {
    const sessionDuration = getSessionPeriod();
    if (sessionDuration)
      track("Session duration", {
        name: typeof title === "string" ? title : "",
        sessionDuration,
      });
  };

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 pt-4 text-${accentColor}-500 justify-between items-center shrink-0`}
      style={{
        minHeight: height + "px",
      }}
    >
      <div className="flex items-center gap-3 basis-1/4">
        <a href="https://saunabuddy.vercel.app">{logo ?? <LKLogo />}</a>
      </div>
      <div className="flex-grow text-center">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
      <div className="flex flex-col sm:flex-row basis-1/4 justify-end items-center gap-2">
        <div className="flex gap-2">
          <PlaygroundDeviceSelector kind="audiooutput" />
          <PlaygroundDeviceSelector kind="audioinput" />
        </div>
        {connectionState === ConnectionState.Connected && (
          <Button
            accentColor="red"
            onClick={() => {
              onConnectClicked();
              logSessionDuration();
            }}
          >
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
};

const LKLogo = () => <img src="/logo.svg" alt="Logo" width="80" height="80" />;
