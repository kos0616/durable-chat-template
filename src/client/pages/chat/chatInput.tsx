import React from "react";

export default function ChatInput({
  className,
  sendMessage,
  name,
}: React.HTMLAttributes<HTMLDivElement> & {
  sendMessage: (message: string) => void;
  name: string;
}) {
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = e.currentTarget.elements.namedItem(
      "content",
    ) as HTMLInputElement;
    const message = content.value;
    sendMessage(message);
    content.value = "";
  };

  return (
    <form className={`flex ${className || ""}`} onSubmit={handleSendMessage}>
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
