"use client";

import { LoadingSVG } from "@/components/button/LoadingSVG";
import { Button } from "@/components/button/Button";
import { ConfigurationPanelItem } from "@/components/config/ConfigurationPanelItem";
import { PlaygroundHeader } from "@/components/playground/PlaygroundHeader";
import { PlaygroundTile } from "@/components/playground/PlaygroundTile";
import { TrackToggle } from "@livekit/components-react";
import { AgentMultibandAudioVisualizer } from "@/components/visualization/AgentMultibandAudioVisualizer";
import { useConfig } from "@/hooks/useConfig";
import { useMultibandTrackVolume } from "@/hooks/useTrackVolume";
import { TranscriptionTile } from "@/transcriptions/TranscriptionTile";
import {
  TrackReferenceOrPlaceholder,
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomInfo,
  useTracks,
} from "@livekit/components-react";
import {
  ConnectionState,
  LocalParticipant,
  RoomEvent,
  Track,
} from "livekit-client";
import { ReactNode, useEffect, useMemo, useState, useRef } from "react";
import ServerSelect from "@/components/playground/ServerSelection";

export interface PlaygroundProps {
  logo?: ReactNode;
  themeColors: string[];
  onConnect: (
    connect: boolean,
    opts?: { token?: string; url?: string; language?: string }
  ) => void;
  serverInfo: { name: string; description: string; url: string }[];
  selectedServerInfo: { name: string; description: string; url: string };
  handleServerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const headerHeight = 56;

export default function Playground({
  logo,
  themeColors,
  onConnect,
  serverInfo,
  selectedServerInfo,
  handleServerChange,
}: PlaygroundProps) {
  const { config, setUserSettings } = useConfig();
  const { name } = useRoomInfo();
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const browserLanguage = navigator.language.split("-")[0];
    return config.settings.language || browserLanguage;
  });
  const { localParticipant } = useLocalParticipant();

  const participants = useRemoteParticipants({
    updateOnlyOn: [RoomEvent.ParticipantMetadataChanged],
  });
  const agentParticipant = participants.find((p) => p.isAgent);

  const roomState = useConnectionState();
  const tracks = useTracks();

  const [showTranscription, setShowTranscription] = useState(true);
  const transcriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomState === ConnectionState.Connected) {
      localParticipant.setCameraEnabled(config.settings.inputs.camera);
      localParticipant.setMicrophoneEnabled(config.settings.inputs.mic);
    }
  }, [config, localParticipant, roomState]);

  let agentAudioTrack: TrackReferenceOrPlaceholder | undefined;
  const aat = tracks.find(
    (trackRef) =>
      trackRef.publication.kind === Track.Kind.Audio &&
      trackRef.participant.isAgent
  );
  if (aat) {
    agentAudioTrack = aat;
  } else if (agentParticipant) {
    agentAudioTrack = {
      participant: agentParticipant,
      source: Track.Source.Microphone,
    };
  }

  const subscribedVolumes = useMultibandTrackVolume(
    agentAudioTrack?.publication?.track,
    5
  );

  useEffect(() => {
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop =
        transcriptionRef.current.scrollHeight;
    }
  }, [agentAudioTrack]);

  const audioTileContent = useMemo(() => {
    const disconnectedContent = (
      <div
        className="flex flex-col items-center justify-center w-full h-full bg-cover bg-center mx-auto"
        style={{
          backgroundImage: "url('/saunabuddy.png')",
          maxWidth: "1024px",
        }}
      >
        {(() => {
          const priorityLanguages = ["en", "fi", "sv", "de"];
          const browserLanguages = (
            navigator.languages || [navigator.language]
          ).map((lang) => lang.split("-")[0]);
          const uniqueLanguages = Array.from(
            new Set([
              ...browserLanguages.filter((lang) =>
                priorityLanguages.includes(lang)
              ),
              ...priorityLanguages,
            ])
          );

          return (
            <select
              className="mb-4 px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-sm"
              onChange={(e) => {
                const newLanguage = e.target.value;
                setSelectedLanguage(newLanguage);
                setUserSettings({
                  ...config.settings,
                  language: newLanguage,
                });
              }}
              value={selectedLanguage}
            >
              {priorityLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {new Intl.DisplayNames([lang], { type: "language" }).of(lang)}
                </option>
              ))}
            </select>
          );
        })()}
        <Button
          accentColor={config.settings.theme_color}
          onClick={() => onConnect(true, { language: selectedLanguage })}
          className="text-lg px-6 py-3"
        >
          Connect
        </Button>
      </div>
    );
    const waitingContent = (
      <div
        className="flex items-center justify-center w-full h-full bg-cover bg-center mx-auto"
        style={{
          backgroundImage: "url('/saunabuddy.png')",
          maxWidth: "1024px",
          maxHeight: "100%",
        }}
      >
        <div className="bg-white bg-opacity-70 p-4 rounded">
          <LoadingSVG />
          <p>Waiting for audio track</p>
        </div>
      </div>
    );

    const visualizerContent = (
      <div
        className="flex flex-col items-center justify-between w-full h-full bg-cover bg-center mx-auto"
        style={{
          backgroundImage: "url('/saunabuddy.png')",
          maxWidth: "1024px",
        }}
      >
        <div className="flex overflow-y-auto items-center h-32 mt-16 md:mt-32">
          <div className="bg-white bg-opacity-70 p-4 rounded relative mr-4">
            <AgentMultibandAudioVisualizer
              state="speaking"
              barWidth={30}
              minBarHeight={30}
              maxBarHeight={150}
              accentColor={config.settings.theme_color}
              accentShade={500}
              frequencies={subscribedVolumes}
              borderRadius={12}
              gap={16}
            />
          </div>

          <TrackToggle
            className="px-2 py-1 bg-gray-900 text-gray-300 border border-gray-800 rounded-sm hover:bg-gray-800 text-xl h-[45px] w-[45px] flex items-center justify-center"
            source={Track.Source.Microphone}
          />
        </div>

        <div
          ref={transcriptionRef}
          className="bg-black bg-opacity-50 p-5 w-full mt-auto relative"
          style={{ maxHeight: "50%", overflowY: "auto" }}
        >
          <button
            onClick={() => setShowTranscription(!showTranscription)}
            className="absolute top-2 right-2 px-2 py-1 bg-gray-700 text-gray-300 rounded-sm hover:bg-gray-600"
          >
            {showTranscription ? "Hide" : "Show"}
          </button>
          {agentAudioTrack && (
            <div style={{ display: showTranscription ? "block" : "none" }}>
              <TranscriptionTile
                agentAudioTrack={agentAudioTrack}
                accentColor={config.settings.theme_color}
              />
            </div>
          )}
        </div>
      </div>
    );
    if (roomState === ConnectionState.Disconnected) {
      return disconnectedContent;
    }

    if (!agentAudioTrack) {
      return waitingContent;
    }

    return visualizerContent;
  }, [
    agentAudioTrack,
    config.settings.theme_color,
    subscribedVolumes,
    roomState,
    onConnect,
    selectedLanguage,
    setUserSettings,
    showTranscription,
  ]);

  useEffect(() => {
    setUserSettings({
      ...config.settings,
      language: selectedLanguage,
    });
  }, [selectedLanguage, setUserSettings, config.settings]);

  return (
    <>
      <ServerSelect
        serverInfo={serverInfo}
        selectedServerInfo={selectedServerInfo}
        handleServerChange={handleServerChange}
      />
      <PlaygroundHeader
        title={selectedServerInfo.name}
        logo={logo}
        githubLink={config.github_link}
        height={headerHeight}
        accentColor={config.settings.theme_color}
        connectionState={roomState}
        onConnectClicked={() =>
          onConnect(roomState === ConnectionState.Disconnected, {
            language: selectedLanguage,
          })
        }
      />
      <div
        className={`flex gap-4 py-4 grow w-full selection:bg-${config.settings.theme_color}-900`}
        style={{ height: "100%", maxHeight: "100%" }}
      >
        <PlaygroundTile
          title=""
          className="w-full h-full grow"
          childrenClassName="justify-center"
        >
          {audioTileContent}
        </PlaygroundTile>
      </div>
    </>
  );
}
