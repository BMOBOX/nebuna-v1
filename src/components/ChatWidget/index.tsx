"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Trash2, Mic, AlertCircle } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";
import type { QuickAction } from "@/types/chat";

const quickActions: QuickAction[] = [
  {
    id: "1",
    label: "Analyze my portfolio",
    icon: "📊",
    prompt: "Analyze my portfolio and give me insights on my performance",
  },
  {
    id: "2",
    label: "Trading tips",
    icon: "💡",
    prompt: "Give me some trading tips for a beginner",
  },
  {
    id: "3",
    label: "Market outlook",
    icon: "📈",
    prompt: "What's the current market outlook for Indian stocks?",
  },
  {
    id: "4",
    label: "Stock suggestions",
    icon: "🎯",
    prompt: "Suggest some good stocks for long-term investment",
  },
];

export function ChatWidget() {
  const {
    messages,
    isLoading,
    isOpen,
    sendMessage,
    clearHistory,
    toggleChat,
    closeChat,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle voice transcript completion - auto-send message
  const handleTranscriptComplete = useCallback((transcript: string) => {
    if (transcript.trim()) {
      sendMessage(transcript.trim());
    }
  }, [sendMessage]);

  const {
    isListening,
    transcript,
    isSupported: isVoiceSupported,
    error: voiceError,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceAssistant(handleTranscriptComplete);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-14 h-14 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-50"
        aria-label="Open chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-zinc-900 dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col z-50 border border-zinc-800 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Trading Assistant
          </h3>
          {/* Voice indicator */}
          {isVoiceSupported && (
            <div className="flex items-center gap-1 ml-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isListening
                    ? "bg-red-500 animate-pulse"
                    : "bg-green-500"
                }`}
                title={isListening ? "Listening..." : "Voice ready"}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={closeChat}
            className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {voiceError && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{voiceError}</span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Hi! I'm your trading assistant. Ask me anything about your
              portfolio or trading strategies.
            </p>
            {isVoiceSupported && (
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                <Mic className="w-4 h-4" />
                <span>Click the microphone to speak</span>
              </div>
            )}
            <QuickActions actions={quickActions} onActionClick={sendMessage} />
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                isSpeaking={isSpeaking && message.role === "assistant"}
                onSpeak={speak}
                onStopSpeaking={stopSpeaking}
                isVoiceSupported={isVoiceSupported}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-zinc-800 dark:bg-zinc-800 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 dark:border-zinc-800">
        <ChatInput
          onSendMessage={sendMessage}
          isLoading={isLoading}
          isListening={isListening}
          transcript={transcript}
          onStartListening={startListening}
          onStopListening={stopListening}
          isVoiceSupported={isVoiceSupported}
        />
      </div>
    </div>
  );
}
