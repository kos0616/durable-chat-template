import { type ChatMessage } from "../../../shared";
import React from "react";
import parseUserAgent from "../../lib/agentFormater";
import TimeDisplay from "../../components/timeDisplay";

interface ChatRoomProps {
  messages?: ChatMessage[];
}

export default function App({ messages = [] }: ChatRoomProps) {
  const userDevice = (agent: string) => {
    const device = parseUserAgent(agent).deviceType;

    const deviceConfig = {
      mobile: { title: "Mobile Device", icon: "fa-mobile-screen-button" },
      tablet: { title: "Tablet Device", icon: "fa-tablet-screen-button" },
      desktop: { title: "Desktop Device", icon: "fa-desktop" },
      unknown: { title: "Unknown Device", icon: "fa-circle-question" },
    };

    const config =
      deviceConfig[device as keyof typeof deviceConfig] || deviceConfig.unknown;

    return (
      <i
        title={config.title}
        className={`fa-solid fa-fw ${config.icon} cursor-help`}
      />
    );
  };

  return (
    <div className="">
      {messages.map((message) => (
        <div key={message.id} className="mb-3 max-w-md">
          <div className="mb-1 text-zinc-600">{message.user}:</div>
          <div className="rounded-xl bg-zinc-200/60 px-4 py-3">
            {message.content}
          </div>
          <div className="mt-1 flex gap-2 text-xs text-gray-400">
            <span className="hover:text-teal-500">{message.user_ip}</span>
            <span className="mr-auto hover:text-teal-500">
              {message.user_country}
            </span>
            <span className="hover:text-teal-500">
              {userDevice(message.user_device)}
            </span>
            <TimeDisplay
              className="hover:text-teal-500"
              timestamp={message.created_at}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
