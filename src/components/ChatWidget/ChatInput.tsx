import React, { useState, FormEvent, useEffect } from "react";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isListening?: boolean;
  transcript?: string;
  onStartListening?: () => void;
  onStopListening?: () => void;
  isVoiceSupported?: boolean;
}

export function ChatInput({
  onSendMessage,
  isLoading,
  isListening = false,
  transcript = "",
  onStartListening,
  onStopListening,
  isVoiceSupported = true,
}: ChatInputProps) {
  const [input, setInput] = useState("");

  // Update input when transcript changes (from voice)
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      onStopListening?.();
    } else {
      setInput(""); // Clear input when starting new recording
      onStartListening?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <div className="flex-1 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Listening..." : "Ask about your portfolio..."}
          disabled={isLoading}
          className="w-full px-4 py-2 pr-10 border border-zinc-800 dark:border-zinc-700 rounded-md bg-zinc-800 dark:bg-zinc-900 text-zinc-200 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
        />
        {isListening && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="flex gap-0.5 items-center h-4">
              <div className="w-1 h-3 bg-red-500 rounded-full animate-pulse" />
              <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse delay-75" />
              <div className="w-1 h-2 bg-red-500 rounded-full animate-pulse delay-150" />
              <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse delay-100" />
              <div className="w-1 h-3 bg-red-500 rounded-full animate-pulse delay-200" />
            </div>
          </div>
        )}
      </div>
      
      {isVoiceSupported && (
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isLoading}
          className={`px-3 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isListening
              ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
              : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
          }`}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          title={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      )}
      
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="px-4 py-2 bg-blue-600 text-zinc-200 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Send message"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
  );
}
