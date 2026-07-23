import { tavily as Tavily } from '@tavily/core';

export const searchInternet = async ({ query }) => {
  console.log("🔍 Internet search triggered for query:", query);

  // 1. Try Tavily API if valid key is configured
  if (process.env.TAVILY_API_KEY && !process.env.TAVILY_API_KEY.includes("dummy")) {
    try {
      const tavily = Tavily({ apiKey: process.env.TAVILY_API_KEY });
      const results = await tavily.search(query, {
        maxResults: 5,
        searchDepth: "advanced"
      });
      return JSON.stringify(results);
    } catch (err) {
      console.warn("Tavily search failed, falling back to web fetch search:", err.message);
    }
  }

  // 2. Fallback public web search via DuckDuckGo HTML endpoint
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    const html = await res.text();

    // Extract text snippets from HTML results
    const cleanSnippet = html
      .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, "")
      .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);

    return JSON.stringify({
      query,
      results: [
        {
          title: `Live Search Results for: ${query}`,
          snippet: cleanSnippet.slice(0, 1000)
        }
      ]
    });
  } catch (fallbackErr) {
    console.error("Web search fallback failed:", fallbackErr);
    return JSON.stringify({ query, results: [], note: "Live web search unavailable" });
  }
};