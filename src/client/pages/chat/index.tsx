import React from "react";
import Messages from "./messages";
import ChatInput from "./chatInput";

interface ChatRoomProps {
  room?: string;
}

export default function ChatRoom({ room }: ChatRoomProps) {
  return (
    <div className="flex flex-col gap-4">
      <Messages room={room}></Messages>
      <ChatInput room={room}></ChatInput>
    </div>
  );
}
