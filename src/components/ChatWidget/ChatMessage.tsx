import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  isSpeaking?: boolean;
  onSpeak?: (text: string) => void;
  onStopSpeaking?: () => void;
  isVoiceSupported?: boolean;
}

export function ChatMessage({
  message,
  isSpeaking = false,
  onSpeak,
  onStopSpeaking,
  isVoiceSupported = true,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const handleSpeakClick = () => {
    if (isSpeaking) {
      onStopSpeaking?.();
    } else {
      onSpeak?.(message.content);
    }
  };

  // Strip markdown for cleaner speech
  const stripMarkdown = (text: string): string => {
    return text
      .replace(/\*\*/g, "") // Bold
      .replace(/\*/g, "") // Italic
      .replace(/`/g, "") // Code
      .replace(/#{1,6}\s/g, "") // Headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
      .replace(/\n/g, " ") // Newlines to spaces
      .trim();
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 group`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 relative ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-800 dark:bg-zinc-800 text-zinc-200 dark:text-zinc-100"
        }`}
      >
        {/* Speaker button for AI messages */}
        {isAssistant && isVoiceSupported && (
          <button
            onClick={handleSpeakClick}
            className={`absolute -left-8 top-1 p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 ${
              isSpeaking
                ? "bg-blue-600 text-white opacity-100"
                : "bg-zinc-700 text-zinc-400 hover:text-zinc-200"
            }`}
            aria-label={isSpeaking ? "Stop speaking" : "Read message aloud"}
            title={isSpeaking ? "Stop speaking" : "Read message aloud"}
          >
            {isSpeaking ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}

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

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute -bottom-1 -right-1">
            <div className="flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-2 bg-white rounded-full animate-pulse" />
                <div className="w-0.5 h-3 bg-white rounded-full animate-pulse delay-75" />
                <div className="w-0.5 h-2 bg-white rounded-full animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
