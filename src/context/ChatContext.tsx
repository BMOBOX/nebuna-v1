"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types/chat";

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const history = await res.json();
        setMessages(history);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Add user message to state
    const userMessage: ChatMessage = {
      role: "user",
      content: message,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, includeContext: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();

      // Add AI response to state
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: data.content,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const res = await fetch("/api/chat", {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  };

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const openChat = () => {
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        isOpen,
        sendMessage,
        clearHistory,
        toggleChat,
        openChat,
        closeChat,
      }}
    >
      {children}
      <div ref={messagesEndRef} />
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
