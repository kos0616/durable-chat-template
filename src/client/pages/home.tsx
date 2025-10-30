import {
  names,
  type ChatMessage,
  type ChatMessageInput,
  type Message,
} from "../../shared";
import React, { useState } from "react";
import { useParams } from "react-router";
import { usePartySocket } from "partysocket/react";
import { nanoid } from "nanoid";

export default function App() {
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
    <div className="rounded-lg border p-6">
      {messages.map((message) => (
        <div key={message.id} className="flex">
          <div className="two columns user">{message.user}</div>
          <div className="ten columns">{message.content}</div>
          <div className="px-2 text-teal-400">{message.user_country}</div>
          <div className="px-2 text-teal-400">{message.user_device}</div>
          <div className="px-2 text-teal-400">{message.user_ip}</div>
          <div className="px-2 text-teal-400">{message.created_at}</div>
        </div>
      ))}
      <form
        className="row"
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
          className="ten columns my-input-text"
          placeholder={`Hello ${name}! Type a message...`}
          autoComplete="off"
        />
        <button type="submit" className="send-message two columns">
          Send
        </button>
      </form>
    </div>
  );
}
