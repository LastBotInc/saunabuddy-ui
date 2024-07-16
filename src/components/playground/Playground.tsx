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
import { ReactNode, useEffect, useMemo, useState } from "react";

export interface PlaygroundProps {
  logo?: ReactNode;
  themeColors: string[];
  onConnect: (connect: boolean, opts?: { token?: string; url?: string; language?: string }) => void;
}

const headerHeight = 56;

export default function Playground({
  logo,
  themeColors,
  onConnect,
}: PlaygroundProps) {
  const { config, setUserSettings } = useConfig();
  const { name } = useRoomInfo();
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const browserLanguage = navigator.language.split('-')[0];
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


  const audioTileContent = useMemo(() => {
    const disconnectedContent = (
      <div
        className="flex flex-col items-center justify-center w-full h-full bg-cover bg-center mx-auto"
        style={{ backgroundImage: "url('/saunabuddy.png')", maxWidth: "1024px" }}
      >
        {(() => {
          const priorityLanguages = ['en', 'fi', 'sv', 'de'];
          const browserLanguages = (navigator.languages || [navigator.language]).map(lang => lang.split('-')[0]);
          const uniqueLanguages = Array.from(new Set([
            ...browserLanguages.filter(lang => priorityLanguages.includes(lang)),
            ...priorityLanguages
          ]));

          return (
            <select
              className="mb-4 px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-sm"
              onChange={(e) => {
                const newLanguage = e.target.value;
                setSelectedLanguage(newLanguage);
                setUserSettings({
                  ...config.settings,
                  language: newLanguage
                });
              }}
              value={selectedLanguage}
            >
              {priorityLanguages.map(lang => (
                <option key={lang} value={lang}>
                  {new Intl.DisplayNames([lang], { type: 'language' }).of(lang)}
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
        style={{ backgroundImage: "url('/saunabuddy.png')", maxWidth: "1024px" }}
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
        style={{ backgroundImage: "url('/saunabuddy.png')", maxWidth: "1024px" }}
      >
        <div className="flex items-center mt-32">
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
            className="px-2 py-1 bg-gray-900 text-gray-300 border border-gray-800 rounded-sm hover:bg-gray-800 text-2xl h-[60px] w-[60px] flex items-center justify-center"
            source={Track.Source.Microphone}
          />
        </div>

        <div className="bg-black bg-opacity-50 p-5 w-full mt-auto relative" style={{ maxHeight: '50%' }}>
          <button
            onClick={() => setShowTranscription(!showTranscription)}
            className="absolute top-2 right-2 px-2 py-1 bg-gray-700 text-gray-300 rounded-sm hover:bg-gray-600"
          >
            {showTranscription ? 'Hide' : 'Show'}
          </button>
          {showTranscription && agentAudioTrack && (
            <TranscriptionTile
              agentAudioTrack={agentAudioTrack}
              accentColor={config.settings.theme_color}
            />
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
  ]);

  useEffect(() => {
    setUserSettings({
      ...config.settings,
      language: selectedLanguage
    });
  }, [selectedLanguage, setUserSettings, config.settings]);

  return (
    <>
      <PlaygroundHeader
        title={config.title}
        logo={logo}
        githubLink={config.github_link}
        height={headerHeight}
        accentColor={config.settings.theme_color}
        connectionState={roomState}
        onConnectClicked={() =>
          onConnect(roomState === ConnectionState.Disconnected, { language: selectedLanguage })
        }
      />
      <div
        className={`flex gap-4 py-4 grow w-full selection:bg-${config.settings.theme_color}-900`}
        style={{ height: `calc(100% - ${headerHeight}px)` }}
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
