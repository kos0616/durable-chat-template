import React from "react";
import Messages from "./messages";
import ChatInput from "./chatInput";

export default function ChatRoom() {
  return (
    <div className="flex flex-col gap-4">
      <Messages></Messages>
      <ChatInput></ChatInput>
    </div>
  );
}
