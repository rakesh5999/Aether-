import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";
import { sendEmail } from "./mail.service.js";
import { modelsConfig } from "../config/models.config.js";
import { requestContext } from "../utils/context.js";
import { selectAutoModel } from "./router.service.js";
import { reportProviderFailure, reportProviderSuccess, getFallbackChain } from "./provider.service.js";

// Lazy getters for AI model clients to prevent startup crashes when API keys are missing/invalid
let geminiLiteModel = null;
let geminiFlashModel = null;
let mistralSmallModel = null;
let mistralLargeModel = null;
let gpt4oMiniModel = null;
let groqLlamaModel = null;

let geminiLiteKey = null;
function getGeminiLiteModel() {
  const currentKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!geminiLiteModel || geminiLiteKey !== currentKey) {
    geminiLiteKey = currentKey;
    geminiLiteModel = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-lite",
      apiKey: currentKey || "AIzaSy_dummy_key",
    });
  }
  return geminiLiteModel;
}

let geminiFlashKey = null;
function getGeminiFlashModel() {
  const currentKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!geminiFlashModel || geminiFlashKey !== currentKey) {
    geminiFlashKey = currentKey;
    geminiFlashModel = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: currentKey || "AIzaSy_dummy_key",
    });
  }
  return geminiFlashModel;
}

function getMistralSmallModel() {
  if (!mistralSmallModel) {
    mistralSmallModel = new ChatMistralAI({
      model: "mistral-small-latest",
      apiKey: process.env.MISTRAL_API_KEY || "dummy_key",
    });
  }
  return mistralSmallModel;
}

function getMistralLargeModel() {
  if (!mistralLargeModel) {
    mistralLargeModel = new ChatMistralAI({
      model: "mistral-large-latest",
      apiKey: process.env.MISTRAL_API_KEY || "dummy_key",
    });
  }
  return mistralLargeModel;
}

function getGpt4oMiniModel() {
  if (!gpt4oMiniModel) {
    gpt4oMiniModel = new ChatOpenAI({
      model: "gpt-4o-mini",
      apiKey: process.env.OPENAI_API_KEY || "sk-dummy_key",
    });
  }
  return gpt4oMiniModel;
}

function getGroqLlamaModel() {
  if (!groqLlamaModel) {
    groqLlamaModel = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY || "gsk_dummy_key",
    });
  }
  return groqLlamaModel;
}

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

// Security wrapper for tools to verify context permission
function enforceToolPermission(toolName) {
  const store = requestContext.getStore();
  if (store) {
    const { userId, allowedTools } = store;
    const isGuest = !userId || userId === "guest";

    if (isGuest && toolName === "emailTool") {
      throw new Error("AUTH_REQUIRED_TOOL: Please sign in to use this tool.");
    }

    if (allowedTools && !allowedTools.includes("all") && !allowedTools.includes(toolName)) {
      throw new Error(`UNAUTHORIZED_TOOL_CALL: Access to tool '${toolName}' is unauthorized.`);
    }
  }
}

// Helper to run internal tool AI tasks with multi-provider fallback
async function runInternalAITask(systemPrompt, userPrompt) {
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt)
  ];

  // 1. Try Groq Llama
  try {
    const response = await getGroqLlamaModel().invoke(messages);
    return response.content;
  } catch (err1) {
    console.warn("Internal AI task (Groq) failed, trying Gemini fallback...", err1.message);
  }

  // 2. Try Gemini Flash
  try {
    const response = await getGeminiLiteModel().invoke(messages);
    return response.content;
  } catch (err2) {
    console.warn("Internal AI task (Gemini) failed, trying Mistral fallback...", err2.message);
  }

  // 3. Try Mistral Small
  try {
    const response = await getMistralSmallModel().invoke(messages);
    return response.content;
  } catch (err3) {
    console.error("All internal tool AI models failed:", err3.message);
    return `[Code Helper Task: ${systemPrompt}]\n\nCode Content:\n\`\`\`\n${userPrompt}\n\`\`\``;
  }
}

const searchInternetTool = tool(
  async (args) => {
    enforceToolPermission("searchInternet");
    return searchInternet(args);
  },
  {
    name: "searchInternet",
    description: "Use this tool to get the latest information from the internet",
    schema: z.object({
      query: z.string().describe("The search query to look up on the internet")
    })
  }
);

const emailTool = tool(
  async (args) => {
    try {
      enforceToolPermission("emailTool");
      return await sendEmail(args);
    } catch (err) {
      if (err.message && err.message.includes("AUTH_REQUIRED_TOOL")) {
        return "Please sign in to use this tool.";
      }
      throw err;
    }
  },
  {
    name: "emailTool",
    description: "Use this tool to send email. The input should be an object with the following properties: to (the recipient's email address), subject",
    schema: z.object({
      to: z.string().describe("The recipient's email address"),
      html: z.string().describe("The HTML content of the email"),
      subject: z.string().describe("The subject of the email"),
    })
  }
);

const explainCodeTool = tool(
  async ({ code, language }) => {
    enforceToolPermission("explain_code");
    return runInternalAITask(
      `You are Aether's internal code explanation helper. Explain this ${language || ''} code clearly, highlighting logic, execution flow, and structure. Keep it beginner-friendly but technically accurate.`,
      code
    );
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
    enforceToolPermission("analyze_error");
    const prompt = `Error/Stack trace:\n${error}\n\n${code ? `Associated Code:\n${code}` : ''}`;
    return runInternalAITask(
      `You are Aether's internal error analysis assistant. Diagnose the root cause of this error log/stack trace, explain why it happened, and suggest step-by-step resolution steps.`,
      prompt
    );
  },
  {
    name: "analyze_error",
    description: "Analyzes stack traces or error logs to diagnose root causes and provide fixes.",
    schema: z.object({
      error: z.string().describe("The error log or stack trace content."),
      code: z.string().optional().describe("Optional code context where the error occurred.")
    })
  }
);

const reviewCodeTool = tool(
  async ({ code }) => {
    enforceToolPermission("review_code");
    return runInternalAITask(
      `You are Aether's code review assistant. Perform a security, performance, and best-practices code review. List issues cleanly with severity ratings (High/Medium/Low) and actionable recommendations.`,
      code
    );
  },
  {
    name: "review_code",
    description: "Performs a code review for security, performance, clean code, and maintainability.",
    schema: z.object({
      code: z.string().describe("The source code to review.")
    })
  }
);

const fixCodeTool = tool(
  async ({ code, issue }) => {
    enforceToolPermission("fix_code");
    const prompt = `Code to fix:\n${code}\n\n${issue ? `Issue/Requirement:\n${issue}` : ''}`;
    return runInternalAITask(
      `You are Aether's automated code fixing assistant. Return the complete corrected code with inline comments explaining what was fixed.`,
      prompt
    );
  },
  {
    name: "fix_code",
    description: "Refactors or fixes buggy code according to described issues.",
    schema: z.object({
      code: z.string().describe("The code snippet containing bugs or needing refactoring."),
      issue: z.string().optional().describe("Description of the bug or desired fix.")
    })
  }
);

const tools = [searchInternetTool, emailTool, explainCodeTool, analyzeErrorTool, reviewCodeTool, fixCodeTool];

function getModelInstance(modelId) {
  switch (modelId) {
    case "gemini-2.5-flash-lite":
      return getGeminiLiteModel();
    case "gemini-2.5-flash":
      return getGeminiFlashModel();
    case "llama-3.3-70b-versatile":
      return getGroqLlamaModel();
    case "mistral-small-latest":
      return getMistralSmallModel();
    case "mistral-large-latest":
      return getMistralLargeModel();
    case "gpt-4o-mini":
      return getGpt4oMiniModel();
    default:
      return getGeminiLiteModel();
  }
}

function getProviderKeyForModel(modelId) {
  if (modelId.startsWith("gemini")) return "google";
  if (modelId.includes("llama") || modelId.includes("gemma")) return "groq";
  if (modelId.startsWith("gpt")) return "openai";
  if (modelId.startsWith("mistral")) return "mistral";
  return "google";
}

export async function generateResponse(messages, selectedModel = "auto", userPlan = "free", proPreviewRemaining = 0) {
  let requestedModel = selectedModel;
  let targetModelId = selectedModel;
  let routingReason = null;
  let isProPreviewEligible = false;

  // 1. Handle Aether Auto routing
  if (selectedModel === "auto") {
    const autoResult = selectAutoModel({
      messages,
      userPlan,
      proPreviewRemaining
    });
    targetModelId = autoResult.targetModelId;
    routingReason = autoResult.routingReason;
    isProPreviewEligible = autoResult.isPreviewEligible;
    console.log(`🤖 Aether Auto Routed request to: [${targetModelId}] - Reason: ${routingReason}`);
  }

  const formattedMessages = [
    new SystemMessage(`
      You are Aether AI — an intelligent, multi-model AI workspace.
      Respond accurately, helpfully, and concisely. Use GitHub Flavored Markdown for rich text formatting and code blocks.
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
      Proactively call tools using native tool calling functionality when appropriate. Do not ask for user permission before using tools.
    `),
    ...formatMessages(messages),
  ];

  // Build candidate fallback chain excluding duplicates
  const rawChain = [targetModelId, ...getFallbackChain(targetModelId, userPlan)];
  const candidateChain = Array.from(new Set(rawChain)).filter(m => modelsConfig[m] && modelsConfig[m].enabled !== false);

  let lastError = null;

  for (let i = 0; i < candidateChain.length; i++) {
    const currentModelId = candidateChain[i];
    const providerKey = getProviderKeyForModel(currentModelId);
    const modelConfig = modelsConfig[currentModelId] || modelsConfig["gemini-2.5-flash-lite"];
    const allowedTools = modelConfig.allowedTools || ["searchInternet"];

    const filteredTools = tools.filter(
      (t) => allowedTools.includes("all") || allowedTools.includes(t.name)
    );

    const modelInstance = getModelInstance(currentModelId);
    const agent = createAgent({
      model: modelInstance,
      tools: filteredTools,
    });

    try {
      const response = await agent.invoke({ messages: formattedMessages });
      reportProviderSuccess(providerKey);

      const lastMessage = response.messages[response.messages.length - 1];
      const lastText = lastMessage.content && lastMessage.content.trim() ? lastMessage.content : "Done!";

      const usage = lastMessage.usage_metadata || lastMessage.response_metadata?.tokenUsage || {};
      let inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
      let outputTokens = usage.output_tokens || usage.completion_tokens || 0;

      if (inputTokens === 0) {
        const promptText = messages.map((m) => m.content).join("\n");
        inputTokens = Math.ceil(promptText.length / 4);
      }
      if (outputTokens === 0) {
        outputTokens = Math.ceil(lastText.length / 4);
      }

      let toolCallsCount = 0;
      for (const msg of response.messages) {
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          toolCallsCount += msg.tool_calls.length;
        }
      }

      const fallbackUsed = currentModelId !== targetModelId;
      const fallbackReason = fallbackUsed
        ? `Primary model ${targetModelId} encountered an error. Aether fallback routed to ${currentModelId}.`
        : null;

      return {
        text: lastText,
        inputTokens,
        outputTokens,
        toolCallsCount,
        modelUsed: currentModelId,
        requestedModel,
        actualModel: currentModelId,
        fallbackUsed,
        fallbackReason,
        routingReason,
        isProPreviewEligible: isProPreviewEligible || (modelConfig.plan === "pro" && userPlan !== "pro")
      };
    } catch (err) {
      console.error(`❌ Execution failed on model [${currentModelId}] (Provider: ${providerKey}):`, err.message);
      reportProviderFailure(providerKey, err);
      lastError = err;
    }
  }

  // All candidate providers failed — throw custom error instead of leaking raw API details
  const providerError = new Error("Aether is temporarily unable to respond. Please try again shortly.");
  providerError.code = "AI_PROVIDER_UNAVAILABLE";
  providerError.lastError = lastError;
  throw providerError;
}

export async function generateTitle(message) {
  const cleanSnippet = typeof message === "string" ? message.slice(0, 200).trim() : "";
  if (!cleanSnippet) return "New Conversation";

  const systemPrompt = "You are a concise title generator. Generate a 2 to 5 word title summarizing the user message. Return ONLY the plain title text without quotes, punctuation, or prefixes like 'Title:'.";
  const userPrompt = `Message: "${cleanSnippet}"`;

  // Helper to sanitize title
  const sanitize = (raw) => {
    if (!raw || typeof raw !== "string") return null;
    let t = raw.trim()
      .replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, "")
      .replace(/^title:\s*/i, "")
      .replace(/[\r\n]+/g, " ")
      .trim();
    if (t.length > 50) t = t.slice(0, 47) + "...";
    return t.length > 0 ? t : null;
  };

  // 1. Try Groq Llama
  try {
    const response = await getGroqLlamaModel().invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);
    const clean = sanitize(response?.content);
    if (clean) return clean;
  } catch (err1) {
    console.warn("generateTitle (Groq) failed, trying Gemini fallback...", err1.message);
  }

  // 2. Try Gemini Lite fallback
  try {
    const response = await getGeminiLiteModel().invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);
    const clean = sanitize(response?.content);
    if (clean) return clean;
  } catch (err2) {
    console.warn("generateTitle (Gemini) failed, trying Mistral fallback...", err2.message);
  }

  // 3. Try Mistral Small fallback
  try {
    const response = await getMistralSmallModel().invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);
    const clean = sanitize(response?.content);
    if (clean) return clean;
  } catch (err3) {
    console.warn("generateTitle (Mistral) failed, using local extraction fallback...", err3.message);
  }

  // 4. Deterministic fallback: extract first 4 meaningful words from the message
  try {
    const words = cleanSnippet
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 0);
    if (words.length > 0) {
      const summary = words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      if (summary) return summary;
    }
  } catch (_) {}

  return "New Conversation";
}