import React, { useState } from "react";
import {
  names,
  type ChatMessage,
  type ChatMessageInput,
  type Message,
} from "../../../shared";
import { usePartySocket } from "partysocket/react";
import { useParams } from "react-router";
import { nanoid } from "nanoid";

export default function ChatInput({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const [name] = useState(names[Math.floor(Math.random() * names.length)]);
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const { room } = useParams();

  const socket = usePartySocket({
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

  return (
    <form
      className={`flex ${className || ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        const content = e.currentTarget.elements.namedItem(
          "content",
        ) as HTMLInputElement;
        const chatMessage: ChatMessageInput = {
          id: nanoid(8),
          content: content.value,
          user: name,
          role: "user",
          user_avatar: "",
        };
        setMessages((messages) => [...messages, chatMessage as any]);
        // we could broadcast the message here

        socket.send(
          JSON.stringify({
            type: "add",
            ...chatMessage,
          } satisfies Message),
        );

        content.value = "";
      }}
    >
      <input
        type="text"
        name="content"
        className="w-full rounded-l-lg border px-2 py-1 outline-teal-400"
        placeholder={`Hello ${name}! Type a message...`}
        autoComplete="off"
      />
      <button
        type="submit"
        className="rounded-r-lg bg-gray-200 px-3 py-1 hover:bg-gray-300/80"
        title="Send a message!"
      >
        Send
      </button>
    </form>
  );
}
