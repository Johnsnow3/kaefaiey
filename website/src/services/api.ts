import {
  Episode,
  MediaMeta,
  MediaStream,
  Post,
  Provider,
  ProviderHealth,
} from "../types";

// Base API origin: automatically uses relative path on Railway or custom origin
const API_BASE = "";

export async function fetchProviders(): Promise<Provider[]> {
  try {
    const res = await fetch(`${API_BASE}/api/providers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.providers || [];
  } catch (err) {
    console.error("fetchProviders error:", err);
    return [];
  }
}

export async function testProviderHealth(
  providerId: string
): Promise<ProviderHealth> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(
      `${API_BASE}/api/${providerId}/posts?filter=&page=1`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      const count = data.posts?.length || data.total || 0;
      return {
        status: "online",
        latencyMs,
        message: `${latencyMs}ms (${count} items)`,
      };
    } else {
      return {
        status: "offline",
        latencyMs,
        message: `HTTP ${res.status}`,
      };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      status: "offline",
      latencyMs,
      message: err.name === "AbortError" ? "Timed out (12s)" : "Offline",
    };
  }
}

export async function fetchCatalog(providerId: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/${providerId}/catalog`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.catalog || [];
  } catch {
    return [];
  }
}

export async function fetchPosts(
  providerId: string,
  filter: string = "",
  page: number = 1
): Promise<{ posts: Post[]; total: number }> {
  try {
    const url = `${API_BASE}/api/${providerId}/posts?filter=${encodeURIComponent(
      filter
    )}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      posts: data.posts || [],
      total: data.total || (data.posts ? data.posts.length : 0),
    };
  } catch (err) {
    console.error(`fetchPosts error [${providerId}]:`, err);
    return { posts: [], total: 0 };
  }
}

export async function searchPosts(
  providerId: string,
  query: string,
  page: number = 1
): Promise<{ posts: Post[]; total: number }> {
  if (!query.trim()) return { posts: [], total: 0 };
  try {
    const url = `${API_BASE}/api/${providerId}/search?q=${encodeURIComponent(
      query.trim()
    )}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      posts: data.posts || [],
      total: data.total || (data.posts ? data.posts.length : 0),
    };
  } catch (err) {
    console.error(`searchPosts error [${providerId}]:`, err);
    return { posts: [], total: 0 };
  }
}

export async function fetchMeta(
  providerId: string,
  link: string
): Promise<MediaMeta | null> {
  try {
    const url = `${API_BASE}/api/${providerId}/meta?link=${encodeURIComponent(
      link
    )}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.meta || null;
  } catch (err) {
    console.error(`fetchMeta error [${providerId}]:`, err);
    return null;
  }
}

export async function fetchEpisodes(
  providerId: string,
  episodesUrl: string
): Promise<Episode[]> {
  try {
    const url = `${API_BASE}/api/${providerId}/episodes?url=${encodeURIComponent(
      episodesUrl
    )}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.episodes || [];
  } catch (err) {
    console.error(`fetchEpisodes error [${providerId}]:`, err);
    return [];
  }
}

export async function fetchStream(
  providerId: string,
  streamLink: string,
  type: "movie" | "series" = "movie",
  isDownload: boolean = false
): Promise<MediaStream[]> {
  try {
    const url = `${API_BASE}/api/${providerId}/stream?link=${encodeURIComponent(
      streamLink
    )}&type=${type}${isDownload ? "&download=true" : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.streams || [];
  } catch (err) {
    console.error(`fetchStream error [${providerId}]:`, err);
    return [];
  }
}

// ─── External Players & Download Managers Helpers ───────────────────────────

export function getProxyStreamUrl(
  streamUrl: string,
  referer?: string,
  cookie?: string,
  isDownload?: boolean,
  filename?: string
): string {
  const params = new URLSearchParams();
  params.set("url", streamUrl);
  if (referer) params.set("referer", referer);
  if (cookie) params.set("cookie", cookie);
  if (isDownload) params.set("download", "1");
  if (filename) params.set("filename", filename);
  return `${window.location.origin}/api/proxy/stream?${params.toString()}`;
}

export function getProxySubtitleUrl(subtitleUrl: string, referer?: string): string {
  if (!subtitleUrl) return "";
  if (subtitleUrl.startsWith("/api/proxy/")) return subtitleUrl;
  const params = new URLSearchParams();
  params.set("url", subtitleUrl);
  if (referer) params.set("referer", referer);
  return `${window.location.origin}/api/proxy/subtitle?${params.toString()}`;
}

export function getVlcUrl(streamUrl: string): string {
  // Mobile & Desktop VLC deep link protocol
  return `vlc://${streamUrl}`;
}

export function getMxPlayerIntent(streamUrl: string, title?: string): string {
  // Android MX Player intent syntax
  const encodedTitle = encodeURIComponent(title || "Video");
  return `intent:${streamUrl}#Intent;package=com.mxtech.videoplayer.ad;type=video/*;S.title=${encodedTitle};end`;
}

export function getMpvCommand(streamUrl: string, headers?: Record<string, string>): string {
  let headerFlags = "";
  if (headers && Object.keys(headers).length > 0) {
    headerFlags = Object.entries(headers)
      .map(([k, v]) => `--http-header-fields="${k}: ${v}"`)
      .join(" ");
  }
  return `mpv "${streamUrl}" ${headerFlags}`.trim();
}

export function getCurlDownloadCommand(
  streamUrl: string,
  headers?: Record<string, string>,
  filename?: string
): string {
  let headerFlags = "";
  if (headers && Object.keys(headers).length > 0) {
    headerFlags = Object.entries(headers)
      .map(([k, v]) => `-H "${k}: ${v}"`)
      .join(" ");
  }
  const outName = filename ? ` -o "${filename}"` : " -O";
  return `curl -L "${streamUrl}" ${headerFlags}${outName}`.trim();
}
