import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../../auth/hook/useAuth";
import { getUsageStats, getModelsRegistry, createCheckoutSession } from "../../subscription/service/subscription.api";
import { FRONTEND_PRICING_CONFIG } from "../../../config/pricing.config";
import GuestLimitModal from "../components/GuestLimitModal";
import { createNewChat, setCurrentChatId, clearChats } from "../chat.slice";

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
    <div className="border border-neutral-800 rounded-xl overflow-hidden my-4 bg-[#1e1e1e] font-mono text-sm shadow-md">
      <div className="flex justify-between items-center px-4 py-2 bg-[#252526] border-b border-neutral-800 text-xs text-neutral-400 font-semibold select-none">
        <span className="uppercase tracking-wider text-[10px] text-orange-400 font-bold">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-emerald-400 font-medium">Copied!</span>
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
      className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#FF6B2C] transition-colors focus:outline-none cursor-pointer mt-2.5 p-1 rounded hover:bg-neutral-100"
      title="Copy full response"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-emerald-500 font-medium">Copied!</span>
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
      <div className="w-8 h-8 rounded-xl bg-[#FF6B2C] flex items-center justify-center flex-shrink-0 shadow-sm text-white font-black text-xs mt-1">
        AE
      </div>
      <div className="bg-[#FAF9F6] rounded-2xl px-5 py-3.5 border border-[#EAEAEA] flex items-center gap-1.5 shadow-sm">
        <span className="text-xs text-neutral-600 font-semibold mr-1">Aether is thinking</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] animate-bounce"></span>
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
  { id: "auto", displayName: "Aether Auto", provider: "Aether Engine", desc: "Smart router selecting the optimal AI model for your prompt", color: "text-[#FF6B2C]", plan: "free", badge: "Recommended" },
  { id: "gemini-2.5-flash-lite", displayName: "Gemini 2.5 Flash Lite", provider: "Google", desc: "Fast & lightweight assistance (Limited Availability)", color: "text-blue-500", plan: "free" },
  { id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash", provider: "Google", desc: "Balanced model for complex logic (Limited Availability)", color: "text-indigo-500", plan: "free" },
  { id: "llama-3.3-70b-versatile", displayName: "Llama 3.3 70B (Groq)", provider: "Groq", desc: "Powerful open reasoning", color: "text-amber-500", plan: "free" },
  { id: "gpt-4o-mini", displayName: "GPT-4o Mini", provider: "OpenAI", desc: "Highly accurate and speedy", color: "text-emerald-500", plan: "pro" },
  { id: "mistral-small-latest", displayName: "Mistral Small", provider: "Mistral", desc: "Efficient reasoning & explanations", color: "text-teal-500", plan: "pro" },
  { id: "mistral-large-latest", displayName: "Mistral Large", provider: "Mistral", desc: "Full-capability advanced reasoning", color: "text-purple-500", plan: "pro" }
];

const Dashboard = () => {
  const chat = useChat();
  const auth = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  const messagesEndRef = useRef(null);

  const messages =
    currentChatId && chats[currentChatId]
      ? chats[currentChatId].messages
      : [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    chat.initailzeSocketConnection();
    if (user) {
      chat.handleGetChats();
      fetchUsage();
    } else {
      dispatch(clearChats());
      dispatch(createNewChat({ chatId: "guest-chat", title: "Guest Chat" }));
      dispatch(setCurrentChatId("guest-chat"));
    }
    fetchConfig();
  }, [user]);

  useEffect(() => {
    if (user && !isLoading && messages.length > 0) {
      fetchUsage();
    }
  }, [isLoading, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const fetchConfig = async () => {
    try {
      const res = await getModelsRegistry();
      if (res?.models) {
        setModelsConfig(res.models);
      }
    } catch (err) {
      console.error("Failed to load models configuration", err);
    }
  };

  const fetchUsage = async () => {
    if (!user) return;
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
    const currentInput = inputValue.trim();
    if (!currentInput) return;

    if (!user) {
      const guestCount = parseInt(localStorage.getItem("aether_guest_prompt_count") || "0", 10);
      if (guestCount >= 3) {
        setIsGuestModalOpen(true);
        return;
      }
    }

    let chatId = currentChatId;
    if (!chatId) {
      if (user) {
        chatId = await chat.handleCreateNewChat();
      } else {
        chatId = "guest-chat";
        dispatch(createNewChat({ chatId: "guest-chat", title: "Guest Chat" }));
        dispatch(setCurrentChatId("guest-chat"));
      }
    }

    setInputValue("");
    setFallbackNotice(null);

    const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await chat.handleSendMessage({
        message: currentInput,
        chatId,
        model: selectedModel,
        history: historyPayload,
      });

      if (!user) {
        const currentCount = parseInt(localStorage.getItem("aether_guest_prompt_count") || "0", 10);
        localStorage.setItem("aether_guest_prompt_count", (currentCount + 1).toString());
      }

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
    if (!promptText.trim()) return;

    if (!user) {
      const guestCount = parseInt(localStorage.getItem("aether_guest_prompt_count") || "0", 10);
      if (guestCount >= 3) {
        setIsGuestModalOpen(true);
        return;
      }
    }

    let chatId = currentChatId;
    if (!chatId) {
      if (user) {
        chatId = await chat.handleCreateNewChat();
      } else {
        chatId = "guest-chat";
        dispatch(createNewChat({ chatId: "guest-chat", title: "Guest Chat" }));
        dispatch(setCurrentChatId("guest-chat"));
      }
    }

    setFallbackNotice(null);

    const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await chat.handleSendMessage({
        message: promptText,
        chatId,
        model: selectedModel,
        history: historyPayload,
      });

      if (!user) {
        const currentCount = parseInt(localStorage.getItem("aether_guest_prompt_count") || "0", 10);
        localStorage.setItem("aether_guest_prompt_count", (currentCount + 1).toString());
      }

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
    <div className="h-screen w-screen flex bg-white text-[#171717] font-sans overflow-hidden">

      {/* Mobile Header Bar */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-[#FAFAF8] border-b border-[#EAEAEA] flex items-center justify-between px-4 z-20">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-neutral-600 hover:text-[#171717] p-1.5 rounded-lg focus:outline-none cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-base font-extrabold text-[#171717]">
          {currentChatId && chats[currentChatId] ? chats[currentChatId].title : "Aether AI"}
        </span>
        <button
          onClick={startNewChat}
          className="text-[#FF6B2C] hover:text-[#E55A1F] p-1.5 rounded-lg focus:outline-none cursor-pointer"
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
          className="md:hidden fixed inset-0 bg-black/40 z-20 transition-opacity duration-300 backdrop-blur-xs"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-72 bg-[#FAFAF8] border-r border-[#EAEAEA] flex flex-col transition-transform duration-300 z-30 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-4 flex items-center justify-between border-b border-[#EAEAEA]">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B2C] flex items-center justify-center shadow-sm">
              <span className="font-black text-xs text-white">AE</span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-[#171717]">
              Aether AI
            </h1>
          </Link>
          <button
            onClick={startNewChat}
            className="p-2 bg-[#FFF5F0] hover:bg-[#FF6B2C] border border-orange-200 hover:border-[#FF6B2C] rounded-xl text-[#FF6B2C] hover:text-white transition-all cursor-pointer shadow-xs"
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
            <div className="text-center py-10 px-4 text-neutral-400 text-xs select-none">
              No conversations yet. Click New Chat above!
            </div>
          ) : (
            sortedChats.map((chatItem) => (
              <div
                key={chatItem.id}
                onClick={() => openChat(chatItem.id)}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs transition-all duration-150 border ${currentChatId === chatItem.id
                    ? "bg-[#FFF4EE] text-[#FF6B2C] font-bold border-orange-200 shadow-2xs"
                    : "text-neutral-700 hover:bg-[#F2F1EE] border-transparent"
                  }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                  <svg className={`w-4 h-4 flex-shrink-0 ${currentChatId === chatItem.id ? "text-[#FF6B2C]" : "text-neutral-400 group-hover:text-neutral-600"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <span className="truncate pr-1 leading-tight">{chatItem.title}</span>
                </div>

                <button
                  onClick={(e) => handleDelete(e, chatItem.id)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-neutral-200 text-neutral-400 hover:text-red-500 p-1 rounded transition-all cursor-pointer"
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
          <div className="mx-3 my-2 p-3 bg-[#FFF8F5] rounded-2xl border border-orange-200 text-xs shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase text-[#FF6B2C] tracking-wider flex items-center gap-1">
                ⚡ Pro Preview
              </span>
              <span className="text-[10px] font-bold text-neutral-700">
                {proPreviewRemaining} messages left
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-tight mt-0.5">
              Try premium models & tools for 5 total messages before upgrading.
            </p>
          </div>
        )}

        {/* User profile section */}
        <div className="p-4 border-t border-[#EAEAEA] bg-[#F7F6F3] flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full bg-[#FF6B2C] flex items-center justify-center text-white font-bold text-sm shadow-xs select-none">
              {user?.username ? user.username[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "U")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-[#171717] truncate leading-tight">
                  {user?.username || "Guest User"}
                </p>
                {user?.plan === "pro" && (
                  <span className="text-[8px] font-black tracking-widest bg-orange-100 text-[#FF6B2C] px-1.5 py-0.25 rounded border border-orange-200 uppercase">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-500 truncate leading-snug">
                {user?.email || "guest@aether.ai"}
              </p>
            </div>
          </div>          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Link
                  to="/settings"
                  className="text-neutral-500 hover:text-[#171717] hover:bg-neutral-200 p-1.5 rounded-lg transition-all cursor-pointer"
                  title="Billing & Settings"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>

                <button
                  onClick={handleLogoutClick}
                  className="text-neutral-500 hover:text-red-600 hover:bg-neutral-200 p-1.5 rounded-lg transition-all cursor-pointer"
                  title="Log Out"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H8.25" />
                  </svg>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

      </aside>

      {/* Main Chat Panel */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden pt-14 md:pt-0 bg-white">

        {/* Top Model Header */}
        <div className="px-6 py-3 border-b border-[#EAEAEA] flex items-center justify-between bg-white z-10">
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF9F6] hover:bg-[#F2F1EE] border border-[#EAEAEA] text-xs rounded-xl font-bold transition-all cursor-pointer text-[#171717] shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#FF6B2C] animate-pulse"></span>
              <span>{activeModelMeta?.displayName}</span>
              {activeModelMeta?.id === "auto" && (
                <span className="text-[8px] bg-orange-100 text-[#FF6B2C] font-black px-1.5 py-0.5 rounded uppercase border border-orange-200">
                  Recommended
                </span>
              )}
              <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isModelDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isModelDropdownOpen && (
              <div className="origin-top-left absolute left-0 mt-2 w-72 rounded-2xl shadow-xl bg-white border border-[#EAEAEA] ring-1 ring-black/5 divide-y divide-[#EAEAEA] z-50 animate-fade-in overflow-hidden">
                {/* Auto Model */}
                <div className="p-1.5">
                  <div
                    onClick={() => handleModelChange(autoModel.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors ${selectedModel === autoModel.id ? "bg-[#FFF4EE]" : "hover:bg-neutral-50"}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#FF6B2C] mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#171717]">{autoModel.displayName}</span>
                        <span className="text-[8px] bg-orange-100 text-[#FF6B2C] font-black px-1 rounded uppercase">Auto</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{autoModel.desc}</p>
                    </div>
                  </div>
                </div>

                {/* Free Models */}
                <div className="p-1.5">
                  <span className="px-2.5 py-1 block text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider">Free Models</span>
                  {freeModels.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleModelChange(m.id)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${selectedModel === m.id ? "bg-[#FFF4EE]" : "hover:bg-neutral-50"}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-[#171717]">{m.displayName}</span>
                        <p className="text-[10px] text-neutral-500">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pro Models */}
                <div className="p-1.5">
                  <span className="px-2.5 py-1 block text-[9px] font-extrabold text-[#FF6B2C] uppercase tracking-wider">Pro Models</span>
                  {proModels.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleModelChange(m.id)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${selectedModel === m.id ? "bg-[#FFF4EE]" : "hover:bg-neutral-50"}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#171717]">{m.displayName}</span>
                          <span className="text-[8px] bg-orange-500 text-white font-black px-1 rounded uppercase">PRO</span>
                        </div>
                        <p className="text-[10px] text-neutral-500">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/pricing" className="text-xs font-bold text-[#FF6B2C] hover:text-[#E55A1F] transition-colors flex items-center gap-1">
            <span>Upgrade Plan</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Messages list container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scrollbar-thin">

          {/* Fallback Notice Banner */}
          {fallbackNotice && (
            <div className="max-w-3xl mx-auto mb-4 p-3.5 bg-orange-50 border border-orange-200 rounded-2xl text-[#C2410C] text-xs flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FF6B2C] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{fallbackNotice}</span>
              </div>
              <button onClick={() => setFallbackNotice(null)} className="text-[#FF6B2C] hover:text-black p-1">✕</button>
            </div>
          )}

          {messages.length === 0 ? (
            // Clean white + orange empty state
            <div className="h-full flex flex-col justify-center items-center max-w-3xl mx-auto w-full text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-[#FF6B2C] flex items-center justify-center text-white text-2xl font-black mb-6 shadow-md shadow-orange-500/20">
                AE
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#171717] mb-2 select-none tracking-tight">
                {getGreeting()}, {user?.username || "Guest"}
              </h2>
              <p className="text-sm md:text-base text-[#6B6B6B] mb-8 max-w-lg select-none leading-relaxed font-medium">
                How can Aether AI help you code, research, or create today?
              </p>

              {/* Suggestions Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full max-w-2xl text-left select-none">
                {suggestions.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(item.prompt)}
                    className="p-4.5 bg-white hover:bg-[#FAF9F6] border border-[#EAEAEA] hover:border-orange-300 rounded-2xl cursor-pointer transition-all duration-200 group shadow-2xs hover:shadow-md"
                  >
                    <h3 className="text-xs font-bold text-[#FF6B2C] mb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]" />
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#6B6B6B] leading-normal font-medium">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Messages mapping
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-32 pt-2">

              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex w-full animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {isUser ? (
                      /* User message bubble */
                      <div className="bg-[#F7F6F3] text-[#171717] px-5 py-3.5 rounded-2xl max-w-[85%] md:max-w-[75%] shadow-2xs text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap select-text border border-[#EAEAEA] font-medium">
                        {msg.content}
                      </div>
                    ) : (
                      /* AI Response layout */
                      <div className="w-full flex items-start gap-4">
                        <div className="w-8 h-8 rounded-xl bg-[#FF6B2C] flex items-center justify-center flex-shrink-0 font-black text-xs select-none shadow-xs text-white mt-1">
                          AE
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-neutral-400 select-none uppercase tracking-widest mb-1.5">
                            Aether AI
                          </p>
                          <div className="prose max-w-none text-[#171717]">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => <h1 className="text-xl font-bold mt-5 mb-2 text-[#171717]">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-lg font-bold mt-4.5 mb-2 text-[#171717]">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-base font-semibold mt-3.5 mb-1.5 text-[#171717]">{children}</h3>,
                                p: ({ children }) => <p className="leading-relaxed mb-3 text-[#171717] text-[14px] md:text-[15px]">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-5 mb-3.5 space-y-1 text-[#171717] text-[14px]">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3.5 space-y-1 text-[#171717] text-[14px]">{children}</ol>,
                                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#FF6B2C] font-semibold hover:underline">{children}</a>,
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-3 border border-[#EAEAEA] rounded-xl">
                                    <table className="min-w-full divide-y divide-[#EAEAEA] text-xs">{children}</table>
                                  </div>
                                ),
                                thead: ({ children }) => <thead className="bg-[#FAF9F6]">{children}</thead>,
                                tbody: ({ children }) => <tbody className="divide-y divide-[#EAEAEA] bg-white">{children}</tbody>,
                                tr: ({ children }) => <tr>{children}</tr>,
                                th: ({ children }) => <th className="px-3 py-2 text-left font-bold text-[#171717]">{children}</th>,
                                td: ({ children }) => <td className="px-3 py-2 text-neutral-600">{children}</td>,
                                blockquote: ({ children }) => <blockquote className="border-l-4 border-[#FF6B2C] pl-3 py-0.5 my-3.5 italic text-neutral-600 bg-orange-50/50 rounded-r-lg">{children}</blockquote>,
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  const lang = match ? match[1] : "";
                                  const codeVal = String(children).replace(/\n$/, "");
                                  return !inline && match ? (
                                    <CodeBlock language={lang} value={codeVal} />
                                  ) : (
                                    <code className="px-1.5 py-0.5 rounded bg-orange-50 text-[#FF6B2C] text-xs font-bold font-mono border border-orange-200/60" {...props}>
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

        {/* Floating Input Box at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-8 pb-6 px-4 z-10">
          <form
            onSubmit={sendMessage}
            className="max-w-3xl mx-auto w-full relative"
          >
            <div className="relative flex items-center bg-white border border-[#EAEAEA] rounded-2xl p-2 shadow-lg focus-within:border-[#FF6B2C] focus-within:ring-2 focus-within:ring-[#FF6B2C]/20 transition-all duration-200">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Aether anything..."
                className="w-full pl-4 pr-12 py-2 text-sm text-[#171717] placeholder-neutral-400 bg-transparent outline-none font-medium"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-9 h-9 rounded-full bg-[#FF6B2C] hover:bg-[#E55A1F] text-white flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-40 disabled:hover:bg-[#FF6B2C] disabled:cursor-not-allowed transition-all duration-150 flex-shrink-0"
                title="Send message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </button>
            </div>
          </form>

          <p className="text-[10px] text-center text-neutral-400 mt-2 font-medium">
            Aether AI can make mistakes. Verify important information.
          </p>
        </div>

      </main>

      {/* Guest Prompt Limit Modal */}
      {isGuestModalOpen && (
        <GuestLimitModal isOpen={isGuestModalOpen} onClose={() => setIsGuestModalOpen(false)} />
      )}

      {/* Upgrade Pro Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-[#EAEAEA] shadow-2xl relative">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-[#171717] p-1 text-sm font-bold"
            >
              ✕
            </button>
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5F0] border border-orange-200 text-[#FF6B2C] flex items-center justify-center font-black text-lg mb-4">
              PRO
            </div>
            <h3 className="text-xl font-black text-[#171717]">Upgrade to Aether Pro</h3>
            <p className="mt-2 text-xs text-neutral-600 leading-relaxed font-medium">
              {upgradeError || "You have used your free preview allocation. Upgrade to Pro for unlimited access to GPT-4o, Mistral Large, and advance routing."}
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={handleUpgrade}
                className="w-full py-3 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                View Pro Plans ({FRONTEND_PRICING_CONFIG.introductoryPrice} intro)
              </button>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-[#EAEAEA] bg-white hover:bg-neutral-50 text-neutral-600 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;