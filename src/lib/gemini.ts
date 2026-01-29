import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyAxWmpr-4MUheiU5Nn7WgEPx8zmKSVg3y8";
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(API_KEY);

// Get the model instance
export const getModel = () => {
  return genAI.getGenerativeModel({ model: MODEL_NAME });
};

// Generate a chat response
export const generateChatResponse = async (
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<string> => {
  const model = getModel();

  // Build the chat history
  const history = messages
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

  // Start a chat session
  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  });

  // Get the last user message
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    throw new Error("Last message must be from user");
  }

  // Generate response
  const result = await chat.sendMessage(lastMessage.content);
  const response = await result.response;
  return response.text();
};

// Generate a response with system prompt
export const generateResponseWithSystem = async (
  userMessage: string,
  systemPrompt: string,
  context?: string
): Promise<string> => {
  const model = getModel();

  // Combine system prompt with context if provided
  const fullSystemPrompt = context
    ? `${systemPrompt}\n\nContext:\n${context}`
    : systemPrompt;

  // Start a chat session with system instruction
  const chat = model.startChat({
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
    systemInstruction: {
      parts: [{ text: fullSystemPrompt }],
    },
  });

  // Generate response
  const result = await chat.sendMessage(userMessage);
  const response = await result.response;
  return response.text();
};
