# Aether AI ✨

Aether is a full-stack, multi-model AI chat platform  think a self-built alternative to ChatGPT/Perplexity that routes each message to whichever underlying model (Gemini, Llama via Groq, GPT-4o Mini, or Mistral) is best suited for it, with accounts, subscriptions, usage limits, and tool-calling built in.

## What it does

You chat with "Aether" like any AI assistant, but under the hood it isn't one model  it's a router sitting in front of four different providers (Google, Groq, OpenAI, Mistral). Depending on your plan and what you're asking, Aether automatically picks the model likely to give the best answer, or you can manually choose a specific model yourself. On top of that, it's a real product: users register and verify their email, get a free plan with daily limits, can upgrade to Pro, and every request's token usage and estimated cost is tracked.

## Core features

- **Multi-provider chat**  Gemini 2.5 Flash/Flash-Lite (Google), Llama 3.3 70B (Groq), GPT-4o Mini (OpenAI), Mistral Small/Large  all wired up as interchangeable model backends.
- **"Aether Auto" smart router** — a rule-based engine (no extra LLM call, so it costs nothing to run) that reads the user's message and conversation, classifies it as coding, needing live search, or complex reasoning, and picks the most appropriate model for the user's plan.
- **Automatic fallback chain** — if a provider is down or a call fails, the backend retries the same request against the next-best model in a fallback chain instead of just erroring out, and reports the provider's health so future routing decisions avoid unhealthy providers.
- **Tool calling** — the AI can proactively call tools mid-conversation: web search (via Tavily), sending emails, explaining code, analyzing error/stack traces, reviewing code for security/performance issues, and fixing buggy code. Tool access is gated per-model and per-plan (e.g. guests can't trigger the email tool).
- **Guest mode** — you can chat without an account at all; guest sessions get a capped set of tools and no persistence.
- **Accounts & auth** — registration with hashed passwords (bcrypt), email verification via a token link, login/logout with JWT-based sessions, and Gmail-alias-aware email normalization (so `john.doe+promo@gmail.com` and `johndoe@gmail.com` are treated as the same account).
- **Plans & billing** — Free and Pro tiers, with both **Stripe** and **Razorpay** integrated for checkout, billing portal access, and webhook-driven subscription updates. New users also get a handful of free "Pro preview" messages to try premium models before upgrading.
- **Usage tracking & budget protection** — every request logs input/output tokens, tool calls, and an estimated USD cost per model per user per day, rolled up against daily/monthly global budget ceilings and per-user cost caps — a financial safety net against runaway API spend.
- **Persistent chats** — conversations and messages are stored in MongoDB per user, with auto-generated chat titles (a lightweight model summarizes the first message into a 2–4 word title).
- **Real-time layer** — Socket.IO is wired in on the backend for live/streaming chat behavior.
- **Admin metrics** — a dedicated endpoint for platform-level usage/health metrics.

## How a message flows through the system

1. The React frontend sends the message (plus selected model and conversation history) to `POST /api/chats/message`.
2. If the user is a guest, the request runs through a lightweight path with no persistence and restricted tools.
3. If the user is logged in, the backend first checks `verifyUsageAndLimits`  is this model allowed on their plan, have they hit their daily request/token limits?
4. If the model is set to **"auto"**, the router service scans the message for coding/search/reasoning signals and picks a concrete model, factoring in the user's plan and whether they have Pro-preview credits left.
5. The chosen model is instantiated (lazily, so a missing API key for an unused provider doesn't crash the whole server) and wrapped in a LangChain agent with the tools that model/plan is allowed to use.
6. The agent runs — possibly calling one or more tools along the way (search, code review, etc.)  and returns a response.
7. If that provider call fails, the backend automatically retries down the fallback chain to the next candidate model instead of failing outright.
8. Token usage and estimated cost are calculated and recorded (`usage.service.js`), the AI's reply is saved to MongoDB, and the response  including which model actually answered, whether a fallback happened, and why the router picked what it picked is sent back to the frontend.

## Frontend structure

Built as a feature-based React app (not just one big `App.jsx`):
- **`features/landing`** — marketing/landing page.
- **`features/auth`** — login, register, email verification/"check your inbox" flow, and a `Protected` route wrapper that gates pages behind authentication.
- **`features/chat`** — the actual chat experience: `Dashboard.jsx` (main chat UI), a `useChat` hook, a Redux slice for chat state, plus separate services for REST calls (`chat.api.js`) and the Socket.IO connection (`chat.socket.js`), and a guest-limit modal that nudges anonymous users to sign up once they hit the guest cap.
- **`features/subscription`** — pricing page and an account/billing management page.
- **State management:** Redux Toolkit, with `auth` and `chat` slices combined in a single store.
- **Routing:** React Router, with distinct routes for `/`, `/chat`, `/settings` (protected), `/pricing`, `/login`, `/register`, `/check-email`, and `/verify-email`.
- Chat responses are rendered with `react-markdown` + GFM, so code blocks and formatting from the AI display properly.

## Backend structure

Node.js + Express, organized by responsibility:
- **`routes/`** — `auth`, `chats`, `subscription`, `admin` route groups.
- **`controller/`** — request handlers for auth, chat, subscription (Stripe/Razorpay), and admin metrics.
- **`services/`** — the real engine room:
  - `ai.service.js` — model instantiation, tool definitions, the agent loop, and fallback handling.
  - `router.service.js` — the deterministic "Aether Auto" model-selection logic.
  - `provider.service.js` — tracks which providers are currently healthy vs. cooling down after failures.
  - `usage.service.js` — enforces per-plan limits and records per-model usage/cost.
  - `internet.service.js` — web search tool integration.
  - `mail.service.js` — transactional email (verification links, the email tool).
- **`models/`** — Mongoose schemas for `User`, `Chat`, `Message`, and `Usage`.
- **`middleware/`** — `authUser` (hard auth gate) and `optionalAuth` (attaches a user if logged in, but allows guests through).
- **`sockets/`** — Socket.IO server setup for real-time features.
- **`config/`** — centralized model registry (`models.config.js`, defining every model's provider, plan tier, daily limits, and allowed tools) and pricing/budget configuration (`pricing.config.js`).

## Tech Stack

**Frontend:** React 19, React Router, Redux Toolkit, Tailwind CSS 4, Vite, Axios, Socket.IO client, React Markdown

**Backend:** Node.js, Express 5, MongoDB + Mongoose, Socket.IO, LangChain (with Google Gemini, Mistral, OpenAI, and Groq integrations), Zod, JWT auth, bcrypt, Stripe + Razorpay, Nodemailer, Tavily (web search)

## Deployment

Frontend is configured for Vercel (`vercel.json` present); backend is a standard Node/Express server designed to run continuously (for Socket.IO) rather than on serverless functions.

## License

No license specified yet  all rights reserved by default.
