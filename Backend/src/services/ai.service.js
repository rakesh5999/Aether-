import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";
import { sendEmail } from "./mail.service.js";

const geminiLiteModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});

const geminiFlashModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
});

const mistralSmallModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

const mistralLargeModel = new ChatMistralAI({
  model: "mistral-large-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

const gpt4oMiniModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

function formatMessages(messages) {
  return messages.map((msg) => {
    if (msg.role === "user") {
      return new HumanMessage(msg.content);
    } else if (msg.role === "ai") {
      return new AIMessage(msg.content);
    } else if (msg.role === "system") {
      return new SystemMessage(msg.content);
    }
  });
}

const searchInternetTool = tool(
  searchInternet,
  {
    name: "searchInternet",
    description: "Use this tool to get the latest information from the internet",
    schema: z.object({
      query: z.string().describe("The search query to look up on the internet")
    })
  }
)

const emailTool = tool(
  sendEmail,
  {
    name: "emailTool",
    description: "Use this tool to send email. The input should be an object with the following properties: to (the recipient's email address), subject",
    schema: z.object({
      to: z.string().describe("The recipient's email address"),
      html: z.string().describe("The HTML content of the email"),
      subject: z.string().describe("The subject of the email"),
    })
  }
)

const explainCodeTool = tool(
  async ({ code, language }) => {
    console.log("🛠️ Tool explain_code triggered");
    try {
      const response = await geminiLiteModel.invoke([
        new SystemMessage(`You are Aether's internal code explanation helper. Explain this ${language || ''} code clearly, highlighting logic, execution flow, and structure. Keep it beginner-friendly but technically accurate.`),
        new HumanMessage(code)
      ]);
      return response.text;
    } catch (err) {
      console.error("explain_code tool error on Gemini, falling back to Mistral:", err);
      const response = await mistralSmallModel.invoke([
        new SystemMessage(`You are Aether's internal code explanation helper. Explain this ${language || ''} code clearly, highlighting logic, execution flow, and structure. Keep it beginner-friendly but technically accurate.`),
        new HumanMessage(code)
      ]);
      return response.text;
    }
  },
  {
    name: "explain_code",
    description: "Explains user-provided source code in detail and in a beginner-friendly language.",
    schema: z.object({
      code: z.string().describe("The source code content to explain."),
      language: z.string().optional().describe("The programming language name (e.g. javascript, python, css).")
    })
  }
);

const analyzeErrorTool = tool(
  async ({ error, code }) => {
    console.log("🛠️ Tool analyze_error triggered");
    const prompt = `Error/Stack trace:\n${error}\n\n${code ? `Associated Code:\n${code}` : ''}`;
    try {
      const response = await geminiLiteModel.invoke([
        new SystemMessage(`You are Aether's internal debugging assistant. Analyze the error message or stack trace, identify the cause (especially if code is provided), and propose clear fixes.`),
        new HumanMessage(prompt)
      ]);
      return response.text;
    } catch (err) {
      console.error("analyze_error tool error on Gemini, falling back to Mistral:", err);
      const response = await mistralSmallModel.invoke([
        new SystemMessage(`You are Aether's internal debugging assistant. Analyze the error message or stack trace, identify the cause (especially if code is provided), and propose clear fixes.`),
        new HumanMessage(prompt)
      ]);
      return response.text;
    }
  },
  {
    name: "analyze_error",
    description: "Analyzes error logs or stack traces alongside optional code to identify the cause and suggest fixes.",
    schema: z.object({
      error: z.string().describe("The error message or stack trace to diagnose."),
      code: z.string().optional().describe("The source code where the error occurred, if applicable.")
    })
  }
);

const reviewCodeTool = tool(
  async ({ code }) => {
    console.log("🛠️ Tool review_code triggered");
    try {
      const response = await geminiLiteModel.invoke([
        new SystemMessage(`You are Aether's internal code reviewer. Review the provided source code for logic bugs, performance inefficiencies, security issues, formatting issues, and suggest improvements.`),
        new HumanMessage(code)
      ]);
      return response.text;
    } catch (err) {
      console.error("review_code tool error on Gemini, falling back to Mistral:", err);
      const response = await mistralSmallModel.invoke([
        new SystemMessage(`You are Aether's internal code reviewer. Review the provided source code for logic bugs, performance inefficiencies, security issues, formatting issues, and suggest improvements.`),
        new HumanMessage(code)
      ]);
      return response.text;
    }
  },
  {
    name: "review_code",
    description: "Performs a code review, highlighting bugs, inefficiencies, or styling issues, and suggesting concrete changes.",
    schema: z.object({
      code: z.string().describe("The source code to review.")
    })
  }
);

const fixCodeTool = tool(
  async ({ code, problemDescription }) => {
    console.log("🛠️ Tool fix_code triggered");
    const prompt = `Code:\n${code}\n\n${problemDescription ? `Problem description: ${problemDescription}` : ''}`;
    try {
      const response = await geminiLiteModel.invoke([
        new SystemMessage(`You are Aether's internal code repair helper. Correct any errors or bugs in the provided code. Provide the corrected complete code, highlighting what was fixed and why.`),
        new HumanMessage(prompt)
      ]);
      return response.text;
    } catch (err) {
      console.error("fix_code tool error on Gemini, falling back to Mistral:", err);
      const response = await mistralSmallModel.invoke([
        new SystemMessage(`You are Aether's internal code repair helper. Correct any errors or bugs in the provided code. Provide the corrected complete code, highlighting what was fixed and why.`),
        new HumanMessage(prompt)
      ]);
      return response.text;
    }
  },
  {
    name: "fix_code",
    description: "Fixes broken code and returns the corrected code block alongside a brief summary of corrections.",
    schema: z.object({
      code: z.string().describe("The buggy or broken source code to fix."),
      problemDescription: z.string().optional().describe("Optional description of the bug, issue, or desired behavior.")
    })
  }
);

const tools = [searchInternetTool, emailTool, explainCodeTool, analyzeErrorTool, reviewCodeTool, fixCodeTool];

const geminiLiteAgent = createAgent({
  model: geminiLiteModel,
  tools,
});

const geminiFlashAgent = createAgent({
  model: geminiFlashModel,
  tools,
});

const mistralSmallAgent = createAgent({
  model: mistralSmallModel,
  tools,
});

const mistralLargeAgent = createAgent({
  model: mistralLargeModel,
  tools,
});

const gpt4oMiniAgent = createAgent({
  model: gpt4oMiniModel,
  tools,
});

export async function generateResponse(messages, selectedModel = "gemini-2.5-flash-lite") {
  const formattedMessages = [
    new SystemMessage(`
      You are Aether, a friendly, professional, and powerful AI coding assistant agent.
      Your primary role is to help users with basic and intermediate programming tasks. You can:
      - Answer coding questions.
      - Generate clean, functional, and well-structured code.
      - Explain code in simple, beginner-friendly language.
      - Debug errors, tracebacks, and runtime warnings.
      - Fix bugs, syntax issues, or logic errors.
      - Review code for potential bugs, best practices, and readability.
      - Refactor code for performance, efficiency, and clarity.
      - Explain computer science/programming concepts.
      - Help with web development (frontend and backend), databases (SQL/NoSQL), APIs, Git, and GitHub.

      Understanding Intent:
      Before responding, analyze the user's input to understand their exact intent. Keep simple answers simple. Do not generate unnecessarily long answers.

      Response Structure for Coding Problems:
      When resolving coding problems or bug fixes, structure your answer as follows when appropriate:
      1. Explain what is happening: A brief summary of the issue.
      2. Explain the problem or concept simply: A beginner-friendly breakdown of why it happens.
      3. Provide the solution: Clear instructions on how to resolve the problem.
      4. Show the required code: Fenced, syntax-highlighted code blocks with language labels (e.g. \`\`\`javascript).
      5. Mention important mistakes or improvements: Common pitfalls to avoid or optimization tips.

      Proactive Tool Use:
      You have access to tools for internet searches, emailing, code explanation, code fixing, error analysis, and code reviews.
      Proactively call the coding tools (explain_code, analyze_error, review_code, fix_code) using the native tool calling functionality when appropriate, rather than trying to perform the sub-task directly yourself. Do not ask for user permission before using tools.
      
      When a user asks you to write something (a joke, content, etc.) and email it, generate that content yourself and send it via tool — do not ask the user to write it for you.
    `),
    ...formatMessages(messages),
  ];

  let agent;
  let modelName = selectedModel;

  switch (selectedModel) {
    case "gemini-2.5-flash-lite":
      agent = geminiLiteAgent;
      break;
    case "gemini-2.5-flash":
      agent = geminiFlashAgent;
      break;
    case "mistral-small-latest":
      agent = mistralSmallAgent;
      break;
    case "mistral-large-latest":
      agent = mistralLargeAgent;
      break;
    case "gpt-4o-mini":
      agent = gpt4oMiniAgent;
      break;
    default:
      agent = geminiLiteAgent;
      modelName = "gemini-2.5-flash-lite";
  }

  try {
    const response = await agent.invoke({ messages: formattedMessages });
    console.log(`✅ Response from ${modelName}`);
    const lastText = response.messages[response.messages.length - 1].text;
    return lastText && lastText.trim() ? lastText : "Done!";
  } catch (err) {
    console.log(`❌ ${modelName} failed. Switching to fallback (geminiLiteAgent)...`);
    console.error(err.message);
    try {
      const response = await geminiLiteAgent.invoke({ messages: formattedMessages });
      console.log("✅ Response from fallback Gemini Lite");
      const lastText = response.messages[response.messages.length - 1].text;
      return lastText && lastText.trim() ? lastText : "Done!";
    } catch (fallbackErr) {
      console.error("Fallback agent also failed:", fallbackErr.message);
      throw fallbackErr;
    }
  }
}

export async function generateTitle(message) {
  const response = await mistralSmallModel.invoke([
    new SystemMessage(`
      You are a helpful assistant that generates concise and descriptive titles for chat conversations.

      User will provide you with the first message of a chat conversation, and you will generate a title that captures the essence of the conversation in 2-4 words.
    `),
    new HumanMessage(`
      Generate a title for a chat conversation based on:
      "${message}"
    `),
  ]);

  return response.text;
}