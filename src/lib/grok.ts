import Groq from "groq-sdk";

const API_KEY = process.env.GROQ_API_KEY || "";
const MODEL_NAME = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

// Initialize the Groq client
const groqClient = new Groq({
  apiKey: API_KEY,
});

// Generate a chat response
export const generateChatResponse = async (
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<string> => {
  // Build messages array for Groq format
  const formattedMessages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [];

  // Add system prompt if provided
  if (systemPrompt) {
    formattedMessages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  // Add conversation messages
  messages.forEach((msg) => {
    if (msg.role !== "system") {
      formattedMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    }
  });

  // Generate response
  const completion = await groqClient.chat.completions.create({
    model: MODEL_NAME,
    messages: formattedMessages,
    max_tokens: 1000,
    temperature: 0.7,
  });

  const responseContent = completion.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error("No response content received from Groq API");
  }

  return responseContent;
};

// Generate a response with system prompt
export const generateResponseWithSystem = async (
  userMessage: string,
  systemPrompt: string,
  context?: string
): Promise<string> => {
  // Combine system prompt with context if provided
  const fullSystemPrompt = context
    ? `${systemPrompt}\n\nContext:\n${context}`
    : systemPrompt;

  // Generate response
  const completion = await groqClient.chat.completions.create({
    model: MODEL_NAME,
    messages: [
      {
        role: "system",
        content: fullSystemPrompt,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  const responseContent = completion.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error("No response content received from Groq API");
  }

  return responseContent;
};
