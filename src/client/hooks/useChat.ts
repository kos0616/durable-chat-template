import { useState, useMemo } from "react";
import { usePartySocket } from "partysocket/react";
import type { ChatMessage, Message, ChatMessageInput } from "../../shared";
import { names } from "../../shared";

export const useChat = (room?: string) => {
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const name = useMemo(
    () => names[Math.floor(Math.random() * names.length)],
    [],
  );

  const socket = usePartySocket({
    host: "https://durable-chat-template.idareyoutodo.workers.dev",
    party: "chat",
    room,
    onOpen: () => {
      console.log("Connected to chat server");
    },
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

  const sendMessage = (content: string) => {
    const chatMessage: ChatMessageInput = {
      id: room || "lobby",
      content: content,
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
  };

  return { messages, socket, setMessages, sendMessage, name };
};
