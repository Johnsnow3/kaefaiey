import { WatchlistItem } from "../types";

const WATCHLIST_KEY = "flimbaazy_watchlist_v1";
const LAST_PROVIDER_KEY = "flimbaazy_selected_provider";
const RECENT_WATCH_KEY = "flimbaazy_recently_watched";

export function getWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(items: WatchlistItem[]): void {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save watchlist to localStorage", e);
  }
}

export function addToWatchlist(item: WatchlistItem): void {
  const current = getWatchlist();
  if (!current.some((x) => x.id === item.id || x.link === item.link)) {
    saveWatchlist([item, ...current]);
  }
}

export function removeFromWatchlist(idOrLink: string): void {
  const current = getWatchlist();
  const updated = current.filter((x) => x.id !== idOrLink && x.link !== idOrLink);
  saveWatchlist(updated);
}

export function clearWatchlist(): void {
  try {
    localStorage.removeItem(WATCHLIST_KEY);
  } catch {}
}

export function toggleWatchlist(item: Omit<WatchlistItem, "addedAt">): boolean {
  const current = getWatchlist();
  const exists = current.some((x) => x.id === item.id || x.link === item.link);
  if (exists) {
    removeFromWatchlist(item.id || item.link);
    return false;
  } else {
    addToWatchlist({ ...item, addedAt: Date.now() });
    return true;
  }
}

export function isInWatchlist(idOrLink: string): boolean {
  const current = getWatchlist();
  return current.some((x) => x.id === idOrLink || x.link === idOrLink);
}

export function getStoredProvider(): string {
  try {
    return localStorage.getItem(LAST_PROVIDER_KEY) || "autoEmbed";
  } catch {
    return "autoEmbed";
  }
}

export function setStoredProvider(providerId: string): void {
  try {
    localStorage.setItem(LAST_PROVIDER_KEY, providerId);
  } catch {}
}

// Aliases
export const getActiveProvider = getStoredProvider;
export const setActiveProvider = setStoredProvider;

export interface WatchProgress {
  title: string;
  provider: string;
  link: string;
  image: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
}

export function getRecentWatches(): WatchProgress[] {
  try {
    const raw = localStorage.getItem(RECENT_WATCH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchProgress(progress: WatchProgress): void {
  try {
    const current = getRecentWatches().filter((x) => x.link !== progress.link);
    const updated = [progress, ...current].slice(0, 15);
    localStorage.setItem(RECENT_WATCH_KEY, JSON.stringify(updated));
  } catch {}
}
