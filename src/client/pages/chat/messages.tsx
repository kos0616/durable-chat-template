import { names, type ChatMessage, type Message } from "../../../shared";
import React, { useState } from "react";
import { usePartySocket } from "partysocket/react";

import parseUserAgent from "../../lib/agentFormater";

import TimeDisplay from "../../components/timeDisplay";

interface ChatRoomProps {
  room?: string;
}

export default function App({ room }: ChatRoomProps) {
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);

  usePartySocket({
    // if no host, it will connect to localhost self
    // host: "localhost:8787",
    party: "chat",
    room,
    onMessage: (evt) => {
      const message = JSON.parse(evt.data as string) as Message;
      if (message.type === "add") {
        const foundIndex = messages.findIndex((m) => m.id === message.id);
        if (foundIndex === -1) {
          // probably someone else who added a message
          setMessages((messages) => [...messages, message as any]);
        } else {
          // this usually means we ourselves added a message
          // and it was broadcasted back
          // so let's replace the message with the new message
          setMessages((messages) => {
            return messages
              .slice(0, foundIndex)
              .concat(message as any)
              .concat(messages.slice(foundIndex + 1));
          });
        }
      } else if (message.type === "update") {
        setMessages((messages) =>
          messages.map((m) => (m.id === message.id ? (message as any) : m)),
        );
      } else {
        setMessages(message.messages);
      }
    },
  });

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
