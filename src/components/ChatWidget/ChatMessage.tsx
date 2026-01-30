import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-800 dark:bg-zinc-800 text-zinc-200 dark:text-zinc-100"
        }`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            strong: ({ children }) => (
              <strong className="font-semibold text-white">{children}</strong>
            ),
            p: ({ children }) => (
              <p className="text-sm whitespace-pre-wrap">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc ml-4 space-y-1">{children}</ul>
            ),
            li: ({ children }) => <li>{children}</li>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
