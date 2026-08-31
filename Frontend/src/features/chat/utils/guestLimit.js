/**
 * Guest prompt limitation and 24-hour refresh utility
 */

export const GUEST_LIMIT = 3;
export const WINDOW_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getGuestPromptStatus() {
  const countStr = localStorage.getItem("aether_guest_prompt_count");
  const windowStartStr = localStorage.getItem("aether_guest_prompt_window_start");

  let count = parseInt(countStr || "0", 10);
  let windowStart = windowStartStr ? parseInt(windowStartStr, 10) : null;

  const now = Date.now();

  // If windowStart exists and 24 hours have passed, refresh the limit
  if (windowStart && now - windowStart >= WINDOW_DURATION_MS) {
    count = 0;
    windowStart = null;
    localStorage.setItem("aether_guest_prompt_count", "0");
    localStorage.removeItem("aether_guest_prompt_window_start");
  } else if (!windowStart && count > 0) {
    // If count exists from legacy storage without windowStart, initialize windowStart now
    windowStart = now;
    localStorage.setItem("aether_guest_prompt_window_start", now.toString());
  }

  // Calculate remaining time
  let timeRemainingMs = 0;
  if (windowStart && count > 0) {
    const elapsed = now - windowStart;
    timeRemainingMs = Math.max(0, WINDOW_DURATION_MS - elapsed);
    if (timeRemainingMs === 0) {
      count = 0;
      windowStart = null;
      localStorage.setItem("aether_guest_prompt_count", "0");
      localStorage.removeItem("aether_guest_prompt_window_start");
    }
  }

  const remainingPrompts = Math.max(0, GUEST_LIMIT - count);
  const isLimitReached = count >= GUEST_LIMIT && timeRemainingMs > 0;

  return {
    count,
    limit: GUEST_LIMIT,
    remainingPrompts,
    isLimitReached,
    timeRemainingMs,
    windowStart
  };
}

export function recordGuestPrompt() {
  const status = getGuestPromptStatus();
  const now = Date.now();

  const newCount = status.count + 1;
  localStorage.setItem("aether_guest_prompt_count", newCount.toString());

  // Set window start timestamp if this is the start of a cycle
  if (!status.windowStart || status.count === 0) {
    localStorage.setItem("aether_guest_prompt_window_start", now.toString());
  }

  return getGuestPromptStatus();
}

export function formatTimeRemaining(ms) {
  if (!ms || ms <= 0) return "Ready to refresh";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
