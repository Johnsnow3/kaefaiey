import { Stream, ProviderContext } from "../types";

const ENDPOINT_URL = "https://d3sgzbosmwirao.cloudfront.net/";
const API_URL = "https://api.mxplayer.in/v1/web";

const defaultHeaders = {
  Referer: "https://www.mxplayer.in/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

function extractJson(text: string, startKey: string): any {
  if (!text || typeof text !== "string") return null;
  const kIdx = text.indexOf(startKey);
  if (kIdx === -1) return null;
  const start = text.indexOf("{", kIdx);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === "\"" && !escape) {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(text.substring(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

export const getStream = async function ({
  link,
  type,
  providerContext,
}: {
  link: string;
  type: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  const { axios } = providerContext;
  const streamLinks: Stream[] = [];

  let streamObj: any = null;

  // ===============================
  // CASE 1: TV / Episode (JSON link)
  // ===============================
  if (link.startsWith("{")) {
    try {
      const data = JSON.parse(link);
      streamObj = data.stream;
    } catch (e) {
      console.error("Failed to parse stream JSON");
    }
  }

  // ===============================
  // CASE 2: URL OR RAW ID
  // ===============================
  else {
    try {
      const isMovieUrl = link.includes("/movie/") || type === "movie";
      const isShowUrl = link.includes("/tvshow/") || link.includes("/show/") || type === "series";

      // Extract ID from URL if present
      const idMatch =
        link.match(/\/detail\/(?:movie|tvshow|show|episode)\/([a-zA-Z0-9_-]+)/i) ||
        link.match(/\/(?:movie|tvshow|show|episode)\/([a-zA-Z0-9_-]+)/i) ||
        (link.length >= 24 && !link.includes("/") ? [, link] : null);

      const id = idMatch ? idMatch[1] : null;

      // ── Sub-case A: Movie ID / URL ──
      if (id && isMovieUrl) {
        // 1. Try movie recommended API
        try {
          const apiUrl = `${API_URL}/detail/tab/movierecommended?type=movie&id=${id}`;
          const res = await axios.get(apiUrl, { headers: defaultHeaders });
          streamObj = res.data?.items?.[0]?.stream || null;
        } catch {
          // fallback to page scrape
        }

        // 2. Fallback: Scrape movie page HTML state
        if (!streamObj) {
          const pageUrl = link.startsWith("http")
            ? link
            : `https://www.mxplayer.in/detail/movie/${id}`;
          const pageRes = await axios.get(pageUrl, { headers: defaultHeaders });
          const rawHtml =
            typeof pageRes.data === "string"
              ? pageRes.data
              : JSON.stringify(pageRes.data);
          const parsed = extractJson(rawHtml, "window.__mxs__");
          const entity =
            (parsed?.entities && (parsed.entities[id] || Object.values(parsed.entities)[0])) || null;
          streamObj = entity?.stream || null;
        }
      }

      // ── Sub-case B: TV Show URL / ID ──
      else if (id && isShowUrl) {
        // Scrape TV show page to get season and first episode
        const pageUrl = link.startsWith("http")
          ? link
          : `https://www.mxplayer.in/detail/tvshow/${id}`;
        const pageRes = await axios.get(pageUrl, { headers: defaultHeaders });
        const rawHtml =
          typeof pageRes.data === "string"
            ? pageRes.data
            : JSON.stringify(pageRes.data);
        const parsed = extractJson(rawHtml, "window.__mxs__");
        const entity =
          (parsed?.entities && (parsed.entities[id] || Object.values(parsed.entities)[0])) || null;

        let seasonId = id;
        const epTab = entity?.tabs?.find(
          (t: any) =>
            t.type === "tvshowepisodes" ||
            t.title === "EPISODES" ||
            (t.containers && t.containers.length > 0)
        );

        if (epTab?.containers && epTab.containers.length > 0) {
          // Find Season 1 (or lowest sequence container)
          const sorted = [...epTab.containers].sort(
            (a: any, b: any) => (a.sequence || 0) - (b.sequence || 0)
          );
          seasonId = sorted[0]?.id || seasonId;
        }

        // Query episodes for this season
        try {
          const epApi = `${API_URL}/detail/tab/tvshowepisodes?type=season&id=${seasonId}&sortOrder=0&device-density=2&platform=com.mxplay.desktop&content-languages=hi,en`;
          const epRes = await axios.get(epApi, { headers: defaultHeaders });
          const items = epRes.data?.items || [];
          streamObj = items[0]?.stream || null;
        } catch (err) {
          console.error("MX episodes query error:", err);
        }
      }

      // ── Sub-case C: Raw Season ID fallback ──
      else if (id) {
        try {
          const epApi = `${API_URL}/detail/tab/tvshowepisodes?type=season&id=${id}&sortOrder=0&device-density=2&platform=com.mxplay.desktop&content-languages=hi,en`;
          const epRes = await axios.get(epApi, { headers: defaultHeaders });
          streamObj = epRes.data?.items?.[0]?.stream || null;
        } catch {
          // ignore
        }

        if (!streamObj) {
          try {
            const apiUrl = `${API_URL}/detail/tab/movierecommended?type=movie&id=${id}`;
            const res = await axios.get(apiUrl, { headers: defaultHeaders });
            streamObj = res.data?.items?.[0]?.stream || null;
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      console.error("MX Stream resolution error:", e);
    }
  }

  // ===============================
  // STREAM EXTRACTION (COMMON)
  // ===============================
  if (streamObj) {
    const seenUrls = new Set<string>();

    const extract = (obj: any, label: string) => {
      if (!obj) return;

      ["high", "base", "main"].forEach((q) => {
        const url = obj[q];
        if (url) {
          const fullUrl = normalizeUrl(url);
          if (!seenUrls.has(fullUrl)) {
            seenUrls.add(fullUrl);
            streamLinks.push({
              server: `MX ${label.toUpperCase()} ${q.toUpperCase()}`,
              link: fullUrl,
              type: label === "hls" ? "m3u8" : "dash",
              headers: {
                Referer: "https://www.mxplayer.in/",
              },
            });
          }
        }
      });
    };

    // Direct HLS & DASH
    if (streamObj.hls) extract(streamObj.hls, "hls");
    if (streamObj.dash) extract(streamObj.dash, "dash");

    // MXPlay nested HLS & DASH
    if (streamObj.mxplay) {
      if (streamObj.mxplay.hls) extract(streamObj.mxplay.hls, "hls");
      if (streamObj.mxplay.dash) extract(streamObj.mxplay.dash, "dash");
    }

    // Third-party streams
    if (streamObj.thirdParty) {
      if (streamObj.thirdParty.hlsUrl) {
        const fullUrl = normalizeUrl(streamObj.thirdParty.hlsUrl);
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl);
          streamLinks.push({
            server: "ThirdParty HLS",
            link: fullUrl,
            type: "m3u8",
            headers: {
              Referer: "https://www.mxplayer.in/",
            },
          });
        }
      }
      if (streamObj.thirdParty.dashUrl) {
        const fullUrl = normalizeUrl(streamObj.thirdParty.dashUrl);
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl);
          streamLinks.push({
            server: "ThirdParty DASH",
            link: fullUrl,
            type: "dash",
            headers: {
              Referer: "https://www.mxplayer.in/",
            },
          });
        }
      }
    }
  }

  return streamLinks;
};

// ===============================
// URL NORMALIZER
// ===============================
function normalizeUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return ENDPOINT_URL + url.replace(/^\/+/, "");
}
