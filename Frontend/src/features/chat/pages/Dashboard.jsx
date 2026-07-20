import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../../auth/hook/useAuth";
import { getUsageStats, getModelsRegistry, createCheckoutSession } from "../../subscription/service/subscription.api";
import { FRONTEND_PRICING_CONFIG } from "../../../config/pricing.config";

// Custom CodeBlock Component with Language badge and Copy button
const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="border border-neutral-800 rounded-xl overflow-hidden my-4 bg-neutral-950 font-mono text-sm shadow-md">
      <div className="flex justify-between items-center px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400 font-semibold select-none">
        <span className="uppercase tracking-wider text-[10px] text-blue-400">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-green-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.675A2.062 2.062 0 1118 7.5a2.062 2.062 0 01-2.062-2.062zM9 10.5h4.875c.621 0 1.125.504 1.125 1.125v6.375M9 10.5v6.375m0-6.375H5.25m3.75 6.375h4.875c.621 0 1.125-.504 1.125-1.125v-1.5m0-3.375a1.125 1.125 0 00-1.125-1.125H9.75" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-neutral-200">
        <pre className="m-0 leading-relaxed font-mono select-text text-left">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};

// Copy Response Button Component
const CopyResponseButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy response:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer mt-2.5 p-1 rounded hover:bg-neutral-800/50"
      title="Copy full response"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-green-400 font-medium">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408l-3.32-3.32m0 0l3.32-3.32m-3.32 3.32h9.492" />
          </svg>
          <span>Copy message</span>
        </>
      )}
    </button>
  );
};

// Pulsing Thinking Loader Component
const ThinkingLoader = () => {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
        <span className="text-xs font-bold text-white">AE</span>
      </div>
      <div className="bg-neutral-800/40 rounded-2xl px-5 py-3.5 border border-neutral-700/30 flex items-center gap-1.5 shadow-inner">
        <span className="text-sm text-neutral-400 font-medium mr-1">Thinking</span>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
      </div>
    </div>
  );
};

// Suggestions lists for empty state
const suggestions = [
  {
    title: "Explain a concept",
    description: "Explain JS closure & scope simply",
    prompt: "Explain how closures and scope work in JavaScript in beginner-friendly terms with code examples."
  },
  {
    title: "Find a bug",
    description: "Fix a Python list comprehension error",
    prompt: "I am getting a TypeError on this Python code: `[x.upper() for x in ['a', 1, 'b']]`. Why and how do I fix it?"
  },
  {
    title: "Write code",
    description: "Create a binary search algorithm",
    prompt: "Write a complete binary search function in Python. Include comments explaining how it works."
  },
  {
    title: "Refactor component",
    description: "Simplify counter React component",
    prompt: "How can I refactor this React component to make it cleaner?\n\n```jsx\nfunction Counter() {\n  const [c, setC] = useState(0);\n  return <button onClick={() => setC(c + 1)}>{c}</button>;\n}\n```"
  }
];

const DEFAULT_MODELS = [
  { id: "auto", displayName: "Aether Auto", provider: "Aether Engine", desc: "Smart router selecting the optimal AI model for your prompt", color: "text-emerald-400", plan: "free", badge: "Recommended" },
  { id: "gemini-2.5-flash-lite", displayName: "Gemini 2.5 Flash Lite", provider: "Google", desc: "Fast & lightweight assistance (Limited Availability)", color: "text-blue-400", plan: "free" },
  { id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash", provider: "Google", desc: "Balanced model for complex logic (Limited Availability)", color: "text-indigo-400", plan: "free" },
  { id: "llama-3.3-70b-versatile", displayName: "Llama 3.3 70B (Groq)", provider: "Groq", desc: "Powerful open reasoning", color: "text-amber-400", plan: "free" },
  { id: "gemma2-9b-it", displayName: "Gemma 2 9B (Groq)", provider: "Groq", desc: "Fast & conversational", color: "text-orange-400", plan: "free" },
  { id: "gpt-4o-mini", displayName: "GPT-4o Mini", provider: "OpenAI", desc: "Highly accurate and speedy", color: "text-green-400", plan: "pro" },
  { id: "mistral-small-latest", displayName: "Mistral Small", provider: "Mistral", desc: "Efficient reasoning & explanations", color: "text-teal-400", plan: "pro" },
  { id: "mistral-large-latest", displayName: "Mistral Large", provider: "Mistral", desc: "Full-capability advanced reasoning", color: "text-purple-400", plan: "pro" }
];

const Dashboard = () => {
  const chat = useChat();
  const auth = useAuth();
  const navigate = useNavigate();

  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const isLoading = useSelector((state) => state.chat.isLoading);
  const user = useSelector((state) => state.auth.user);

  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem("selectedModel") || "auto";
  });
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelsConfig, setModelsConfig] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [proPreviewRemaining, setProPreviewRemaining] = useState(5);
  const [fallbackNotice, setFallbackNotice] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  const messagesEndRef = useRef(null);

  const messages =
    currentChatId && chats[currentChatId]
      ? chats[currentChatId].messages
      : [];

  useEffect(() => {
    chat.initailzeSocketConnection();
    chat.handleGetChats();
    fetchConfig();
    fetchUsage();
  }, []);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      fetchUsage();
    }
  }, [isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const fetchConfig = async () => {
    try {
      const res = await getModelsRegistry();
      setModelsConfig(res.models);
    } catch (err) {
      console.error("Failed to load models configuration", err);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await getUsageStats();
      setUsageStats(res.usage);
      if (res.proPreviewRemaining !== undefined) {
        setProPreviewRemaining(res.proPreviewRemaining);
      }
    } catch (err) {
      console.error("Failed to load usage statistics", err);
    }
  };

  const handleUpgrade = () => {
    navigate("/pricing");
  };

  const handleLogoutClick = async () => {
    if (confirm("Are you sure you want to log out of Aether AI?")) {
      await auth.handleLogout();
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    let chatId = currentChatId;
    if (!chatId) {
      chatId = await chat.handleCreateNewChat();
    }

    const currentInput = inputValue;
    setInputValue("");
    setFallbackNotice(null);
    
    try {
      const res = await chat.handleSendMessage({
        message: currentInput,
        chatId,
        model: selectedModel,
      });

      if (res && res.fallbackUsed) {
        setFallbackNotice(`${res.requestedModel} was temporarily unavailable. Aether used ${res.actualModel} instead.`);
      }
    } catch (error) {
      console.error("Send message error:", error);
      const apiErr = error.response?.data;
      if (apiErr && (apiErr.error === "UPGRADE_REQUIRED" || apiErr.error === "LIMIT_EXCEEDED")) {
        setUpgradeError(apiErr.message);
        setIsUpgradeModalOpen(true);
      }
    }
  };

  const handleSuggestionClick = async (promptText) => {
    let chatId = currentChatId;
    if (!chatId) {
      chatId = await chat.handleCreateNewChat();
    }

    setFallbackNotice(null);

    try {
      const res = await chat.handleSendMessage({
        message: promptText,
        chatId,
        model: selectedModel,
      });

      if (res && res.fallbackUsed) {
        setFallbackNotice(`${res.requestedModel} was temporarily unavailable. Aether used ${res.actualModel} instead.`);
      }
    } catch (error) {
      console.error("Suggestion click error:", error);
      const apiErr = error.response?.data;
      if (apiErr && (apiErr.error === "UPGRADE_REQUIRED" || apiErr.error === "LIMIT_EXCEEDED")) {
        setUpgradeError(apiErr.message);
        setIsUpgradeModalOpen(true);
      }
    }
  };

  const handleModelChange = (modelId) => {
    const registry = modelsConfig || DEFAULT_MODELS.reduce((acc, m) => { acc[m.id] = m; return acc; }, {});
    const targetModel = registry[modelId];

    if (targetModel && targetModel.plan === "pro" && user?.plan !== "pro" && proPreviewRemaining <= 0) {
      setIsUpgradeModalOpen(true);
      setIsModelDropdownOpen(false);
      return;
    }

    setSelectedModel(modelId);
    localStorage.setItem("selectedModel", modelId);
    setIsModelDropdownOpen(false);
  };

  const handleUpgradeTrigger = () => {
    setIsUpgradeModalOpen(true);
  };

  const openChat = (chatId) => {
    chat.handleOpenChat(chatId);
    setIsSidebarOpen(false);
  };

  const handleDelete = (e, chatId) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat?")) {
      chat.handleDeleteChat(chatId);
    }
  };

  const startNewChat = () => {
    chat.handleCreateNewChat();
    setIsSidebarOpen(false);
  };

  const sortedChats = Object.values(chats).sort((a, b) => {
    return new Date(b.lastUpdated) - new Date(a.lastUpdated);
  });

  const registry = modelsConfig || DEFAULT_MODELS.reduce((acc, m) => { acc[m.id] = m; return acc; }, {});
  const activeModelMeta = registry[selectedModel] || DEFAULT_MODELS[0];
  const listModels = Object.values(registry);

  const autoModel = listModels.find(m => m.id === "auto") || DEFAULT_MODELS[0];
  const freeModels = listModels.filter(m => m.plan === "free" && m.id !== "auto");
  const proModels = listModels.filter(m => m.plan === "pro");

  return (
    <div className="h-screen w-screen flex bg-neutral-900 text-neutral-100 font-sans overflow-hidden">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 z-20">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-neutral-400 hover:text-white p-1 rounded-md focus:outline-none cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          {currentChatId && chats[currentChatId] ? chats[currentChatId].title : "Aether"}
        </span>
        <button
          onClick={startNewChat}
          className="text-neutral-400 hover:text-white p-1 rounded-md focus:outline-none cursor-pointer"
        >
          <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 z-20 transition-opacity duration-300"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-72 bg-neutral-950 border-r border-neutral-800 flex flex-col transition-transform duration-300 z-30 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-4 flex items-center justify-between border-b border-neutral-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <span className="font-black text-sm text-white">AE</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Aether
            </h1>
          </div>
          <button
            onClick={startNewChat}
            className="p-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm"
            title="Start New Chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {sortedChats.length === 0 ? (
            <div className="text-center py-10 px-4 text-neutral-600 text-xs select-none">
              No conversations yet. Start a new chat above!
            </div>
          ) : (
            sortedChats.map((chatItem) => (
              <div
                key={chatItem.id}
                onClick={() => openChat(chatItem.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all duration-150 border ${
                  currentChatId === chatItem.id
                    ? "bg-neutral-800/75 text-white font-medium border-neutral-700/40"
                    : "text-neutral-450 hover:bg-neutral-900/60 hover:text-neutral-200 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                  <svg className={`w-4 h-4 flex-shrink-0 ${currentChatId === chatItem.id ? "text-blue-500" : "text-neutral-500 group-hover:text-neutral-400"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <span className="truncate pr-1 leading-tight">{chatItem.title}</span>
                </div>
                
                <button
                  onClick={(e) => handleDelete(e, chatItem.id)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-neutral-800 text-neutral-500 hover:text-red-400 p-1 rounded transition-all cursor-pointer"
                  title="Delete chat"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pro Preview Banner Pill for Free users */}
        {user?.plan !== "pro" && (
          <div className="mx-3 my-2 p-3 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-neutral-900 rounded-xl border border-blue-500/30 text-xs shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1">
                ⚡ Pro Preview
              </span>
              <span className="text-[10px] font-bold text-neutral-300">
                {proPreviewRemaining} messages left
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
              Try premium models & tools for 5 total messages before upgrading.
            </p>
          </div>
        )}

        {/* Free Limits Indicator in Sidebar */}
        {user?.plan !== "pro" && usageStats && registry[selectedModel] && registry[selectedModel].plan === "free" && selectedModel !== "auto" && (
          <div className="mx-3 my-2 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 text-xs shadow-inner">
            <div className="flex justify-between items-center mb-1 text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
              <span>Daily Limits</span>
              <button onClick={handleUpgradeTrigger} className="text-blue-400 hover:text-blue-300 font-extrabold focus:outline-none transition-colors">
                Upgrade
              </button>
            </div>
            {(() => {
              const conf = registry[selectedModel];
              const modelUsage = usageStats[selectedModel] || { requests: 0 };
              const remaining = Math.max(0, conf.dailyRequestLimit - modelUsage.requests);
              const percent = Math.min(100, Math.ceil((remaining / conf.dailyRequestLimit) * 100));
              return (
                <div className="text-neutral-400 mt-1">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="truncate max-w-[120px]">{conf.displayName}</span>
                    <span className="font-semibold text-neutral-200">{remaining} remaining</span>
                  </div>
                  <div className="w-full bg-neutral-950 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${percent < 20 ? "bg-red-500" : percent < 55 ? "bg-amber-500" : "bg-blue-500"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* User profile section */}
        <div className="p-4 border-t border-neutral-800/60 bg-neutral-950/80 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full bg-blue-750/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm select-none">
              {user?.username ? user.username[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "U")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-neutral-300 truncate leading-tight">
                  {user?.username || "Aether User"}
                </p>
                {user?.plan === "pro" && (
                  <span className="text-[8px] font-black tracking-widest bg-blue-600/10 text-blue-400 px-1.5 py-0.25 rounded border border-blue-900/50 uppercase shadow-sm">
                    Pro
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-500 truncate leading-snug">
                {user?.email || "coding-assistant@aether.ai"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Link
              to="/settings"
              className="text-neutral-500 hover:text-white hover:bg-neutral-900/60 p-1.5 rounded-lg transition-all duration-150 cursor-pointer"
              title="Billing & Settings"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            
            <button
              onClick={handleLogoutClick}
              className="text-neutral-500 hover:text-red-400 hover:bg-neutral-900/60 p-1.5 rounded-lg transition-all duration-150 cursor-pointer"
              title="Log Out"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H8.25" />
              </svg>
            </button>
          </div>
        </div>

      </aside>

      {/* Main Chat Panel */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden pt-14 md:pt-0">
        
        {/* Messages list container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scrollbar-thin">
          
          {/* Fallback Notice Banner */}
          {fallbackNotice && (
            <div className="max-w-3xl mx-auto mb-4 p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{fallbackNotice}</span>
              </div>
              <button onClick={() => setFallbackNotice(null)} className="text-amber-400 hover:text-white p-1">✕</button>
            </div>
          )}

          {messages.length === 0 ? (
            // Clean empty state with logo & cards
            <div className="h-full flex flex-col justify-center items-center max-w-3xl mx-auto w-full text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black mb-6 shadow-lg shadow-blue-900/30 animate-pulse">
                AE
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 select-none tracking-tight">
                I'm Aether, your coding assistant
              </h2>
              <p className="text-sm md:text-base text-neutral-400 mb-8 max-w-lg select-none leading-relaxed">
                Ask me to write scripts, debug compile-time errors, review logic, or explain difficult programming concepts.
              </p>

              {/* Suggestions Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full max-w-2xl text-left select-none">
                {suggestions.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(item.prompt)}
                    className="p-4 bg-neutral-850 hover:bg-neutral-800/80 border border-neutral-800 rounded-xl cursor-pointer transition-all duration-200 group shadow-sm hover:shadow hover:border-neutral-700"
                  >
                    <h3 className="text-xs font-bold text-blue-400 mb-1 group-hover:text-blue-300 transition-colors uppercase tracking-wider">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-normal">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Messages mapping
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-32 pt-4">
              
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div 
                    key={index} 
                    className={`flex w-full animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {isUser ? (
                      /* User message bubble */
                      <div className="bg-neutral-850 hover:bg-neutral-800 text-neutral-200 px-5 py-3 rounded-2xl max-w-[80%] md:max-w-[70%] shadow-sm text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap select-text border border-neutral-800/60 transition-colors duration-150">
                        {msg.content}
                      </div>
                    ) : (
                      /* AI Response layout */
                      <div className="w-full flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs select-none shadow-md text-white mt-1">
                          AE
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-neutral-500 select-none uppercase tracking-widest mb-1.5">
                            Aether
                          </p>
                          <div className="prose prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => <h1 className="text-xl font-bold mt-5 mb-2 text-white">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-lg font-bold mt-4.5 mb-2 text-neutral-100">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-base font-semibold mt-3.5 mb-1.5 text-neutral-200">{children}</h3>,
                                p: ({ children }) => <p className="leading-relaxed mb-3 text-neutral-300 text-[14px] md:text-[15px]">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-5 mb-3.5 space-y-1 text-neutral-300 text-[14px]">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3.5 space-y-1 text-neutral-300 text-[14px]">{children}</ol>,
                                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>,
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-3 border border-neutral-800 rounded-lg">
                                    <table className="min-w-full divide-y divide-neutral-800 text-xs">{children}</table>
                                  </div>
                                ),
                                thead: ({ children }) => <thead className="bg-neutral-850">{children}</thead>,
                                tbody: ({ children }) => <tbody className="divide-y divide-neutral-800 bg-neutral-900/10">{children}</tbody>,
                                tr: ({ children }) => <tr>{children}</tr>,
                                th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-neutral-300">{children}</th>,
                                td: ({ children }) => <td className="px-3 py-2 text-neutral-400">{children}</td>,
                                blockquote: ({ children }) => <blockquote className="border-l-4 border-neutral-700 pl-3 py-0.5 my-3.5 italic text-neutral-400">{children}</blockquote>,
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  const lang = match ? match[1] : "";
                                  const codeVal = String(children).replace(/\n$/, "");
                                  return !inline && match ? (
                                    <CodeBlock language={lang} value={codeVal} />
                                  ) : (
                                    <code className="px-1.5 py-0.5 rounded bg-neutral-800 text-rose-400 text-xs font-semibold font-mono" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                            <CopyResponseButton text={msg.content} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Animated Thinking state */}
              {isLoading && <ThinkingLoader />}

              <div ref={messagesEndRef} />

            </div>
          )}

        </div>

        {/* Fixed Input Form at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-900 via-neutral-900/90 to-transparent pt-10 pb-6 px-4 z-10">
          <form
            onSubmit={sendMessage}
            className="max-w-3xl mx-auto w-full relative"
          >
            {/* Model Selector Dropdown */}
            <div className="relative mb-3 flex items-center justify-between">
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs rounded-xl font-medium transition-all duration-200 cursor-pointer shadow-sm text-neutral-300 focus:outline-none"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-semibold">{activeModelMeta?.displayName}</span>
                  {activeModelMeta?.id === "auto" && (
                    <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded uppercase border border-emerald-500/40">
                      Recommended
                    </span>
                  )}
                  <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isModelDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isModelDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setIsModelDropdownOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 mb-2 w-84 bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-2.5 z-50 animate-fade-in max-h-[380px] overflow-y-auto divide-y divide-neutral-800/40">
                      
                      {/* Aether Auto Recommended Section */}
                      {autoModel && (
                        <div className="pb-2">
                          <div className="px-2 py-1 text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-between">
                            <span>Smart Auto Routing</span>
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded uppercase">Recommended</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleModelChange("auto")}
                            className={`w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 cursor-pointer mt-1
                              ${selectedModel === "auto" 
                                ? "bg-emerald-600/15 text-white border-l-2 border-emerald-500" 
                                : "bg-neutral-900/50 hover:bg-neutral-850 text-neutral-300"}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-emerald-300">Aether Auto</span>
                                <span className="text-[7.5px] px-1 py-0.25 rounded font-extrabold uppercase bg-neutral-800 text-neutral-400">
                                  AI Router
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">{autoModel.desc}</p>
                            </div>
                          </button>
                        </div>
                      )}

                      <div className="py-2">
                        <div className="px-2 py-1 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                          Free Models
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {freeModels.map((model) => (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => handleModelChange(model.id)}
                              className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-xl transition-all duration-150 cursor-pointer
                                ${selectedModel === model.id 
                                  ? "bg-blue-600/10 text-white border-l-2 border-blue-500" 
                                  : "text-neutral-450 hover:bg-neutral-900/60 hover:text-neutral-200"}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs font-semibold ${selectedModel === model.id ? "text-blue-400" : "text-neutral-200"}`}>
                                    {model.displayName}
                                  </span>
                                  <span className="text-[7.5px] px-1 py-0.25 rounded font-extrabold uppercase border border-neutral-800/80 text-neutral-550">
                                    {model.provider}
                                  </span>
                                </div>
                                <p className="text-[10px] text-neutral-500 mt-0.5 truncate">{model.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="px-2 py-1 text-[9px] font-bold text-blue-400 uppercase tracking-widest flex items-center justify-between">
                          <span className="flex items-center gap-1">Pro Models</span>
                          {user?.plan !== "pro" && proPreviewRemaining > 0 && (
                            <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">
                              ⚡ Preview ({proPreviewRemaining} left)
                            </span>
                          )}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {proModels.map((model) => {
                            const hasProAccess = user?.plan === "pro" || proPreviewRemaining > 0;
                            return (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => handleModelChange(model.id)}
                                className={`w-full text-left flex items-start justify-between gap-2 px-2 py-1.5 rounded-xl transition-all duration-150 cursor-pointer
                                  ${selectedModel === model.id 
                                    ? "bg-blue-600/10 text-white border-l-2 border-blue-500" 
                                    : "text-neutral-450 hover:bg-neutral-900/60 hover:text-neutral-200"}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-semibold ${selectedModel === model.id ? "text-blue-400" : "text-neutral-200"}`}>
                                      {model.displayName}
                                    </span>
                                    <span className="text-[7.5px] px-1 py-0.25 rounded font-extrabold uppercase border border-neutral-800/80 text-neutral-550">
                                      {model.provider}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-neutral-500 mt-0.5 truncate">{model.desc}</p>
                                </div>
                                {!hasProAccess && (
                                  <svg className="w-3.5 h-3.5 text-neutral-600 self-center" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Aether to write or debug code..."
                disabled={isLoading}
                className="w-full bg-neutral-800 border border-neutral-750 focus:border-neutral-600 rounded-2xl pl-5 pr-14 py-4 outline-none text-white text-sm shadow-xl transition-all placeholder-neutral-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-3.5 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white disabled:text-neutral-500 disabled:cursor-not-allowed transition-all cursor-pointer shadow"
                title="Send message"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-neutral-600 text-center mt-2.5 select-none">
              Aether may provide output that requires compilation checking. Review code carefully.
            </p>
          </form>
        </div>

      </main>

      {/* Upgrade to Pro Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-md">
          <div className="relative max-w-md w-full rounded-3xl border border-blue-500/30 bg-neutral-950 p-6 md:p-8 shadow-2xl flex flex-col gap-5 text-left">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors focus:outline-none cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {upgradeError && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{upgradeError}</span>
              </div>
            )}

            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-black mb-3 shadow-lg shadow-blue-900/35">
                AE
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">Unlock Aether Pro</h2>
              <p className="text-xs text-neutral-400 mt-1">Get advanced programming assistance immediately</p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center">
              <span className="text-2xl font-black text-white">{FRONTEND_PRICING_CONFIG.introductoryPrice}</span>
              <span className="text-xs text-neutral-400 font-semibold"> for your {FRONTEND_PRICING_CONFIG.introductoryPeriodText}</span>
              <p className="text-[10px] text-neutral-500 font-medium mt-1">{FRONTEND_PRICING_CONFIG.offerHeadline}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Main Benefits Included:</h3>
              <ul className="space-y-2.5">
                {FRONTEND_PRICING_CONFIG.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              className="w-full mt-2 text-center py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-extrabold tracking-wide shadow-md transition-all transform active:translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {upgradeLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Upgrade to Pro Now</span>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;