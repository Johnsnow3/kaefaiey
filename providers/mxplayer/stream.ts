import { Stream, ProviderContext } from "../types";

const ENDPOINT_URL = "https://d3sgzbosmwirao.cloudfront.net/";
const API_URL = "https://api.mxplayer.in/v1/web";

const defaultHeaders = {
  Referer: "https://www.mxplayer.in/",
  Origin: "https://www.mxplayer.in",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

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
      const isShow = link.includes("/tvshow/") || link.includes("/show/") || type === "series";

      // Extract ID from URL if present
      const idMatch =
        link.match(/\/detail\/(?:movie|tvshow|show|episode)\/([a-zA-Z0-9_-]+)/i) ||
        link.match(/\/(?:movie|tvshow|show|episode)\/([a-zA-Z0-9_-]+)/i) ||
        (link.length >= 24 && !link.includes("/") ? [, link] : null);

      const id = idMatch ? idMatch[1] : null;

      if (id && !isShow) {
        // ── Movie Stream Extraction ──
        // 1. Direct REST video endpoint (contains direct thirdParty and HLS stream)
        try {
          const videoApi = `${API_URL}/detail/video?id=${id}&type=movie`;
          const res = await axios.get(videoApi, { headers: defaultHeaders });
          streamObj = res.data?.stream || null;
        } catch {
          // ignore
        }

        // 2. Fallback: Movie recommended endpoint
        if (!streamObj || (!streamObj.hls && !streamObj.thirdParty && !streamObj.mxplay)) {
          try {
            const apiUrl = `${API_URL}/detail/tab/movierecommended?type=movie&id=${id}`;
            const res = await axios.get(apiUrl, { headers: defaultHeaders });
            streamObj = res.data?.items?.[0]?.stream || streamObj;
          } catch {
            // ignore
          }
        }
      } else if (id && isShow) {
        // ── TV Show / Series Stream Extraction ──
        // 1. Query seasons to get Season 1 ID
        let seasonId = id;
        try {
          const seasonsUrl = `${API_URL}/detail/tab/tvshowseasons?type=tvshow&id=${id}&device-density=2&platform=com.mxplay.desktop&content-languages=hi,en`;
          const sRes = await axios.get(seasonsUrl, { headers: defaultHeaders });
          const items = sRes.data?.items || [];
          const season1 = items.find((s: any) => s.sequence === 1) || items[0];
          if (season1?.id) {
            seasonId = season1.id;
          }
        } catch {
          // ignore
        }

        // 2. Query episodes for this season to get Episode 1 stream
        try {
          const epApi = `${API_URL}/detail/tab/tvshowepisodes?type=season&id=${seasonId}&sortOrder=0&device-density=2&platform=com.mxplay.desktop&content-languages=hi,en`;
          const epRes = await axios.get(epApi, { headers: defaultHeaders });
          const items = epRes.data?.items || [];
          streamObj = items[0]?.stream || null;
        } catch {
          // ignore
        }
      } else if (id) {
        // ── Raw Season/Episode ID ──
        try {
          const epApi = `${API_URL}/detail/tab/tvshowepisodes?type=season&id=${id}&sortOrder=0&device-density=2&platform=com.mxplay.desktop&content-languages=hi,en`;
          const epRes = await axios.get(epApi, { headers: defaultHeaders });
          streamObj = epRes.data?.items?.[0]?.stream || null;
        } catch {
          // ignore
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

    const addStream = (url: string, label: string, streamType: string) => {
      if (!url) return;
      const fullUrl = normalizeUrl(url);
      if (!seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        streamLinks.push({
          server: label,
          link: fullUrl,
          type: streamType,
          headers: {
            Referer: "https://www.mxplayer.in/",
          },
        });
      }
    };

    // 1. Third-party direct stream (e.g. Dybbuk and Prime syndications)
    if (streamObj.thirdParty) {
      if (streamObj.thirdParty.hlsUrl) {
        addStream(streamObj.thirdParty.hlsUrl, "MX HLS 1080p", "m3u8");
      }
      if (streamObj.thirdParty.dashUrl) {
        addStream(streamObj.thirdParty.dashUrl, "MX DASH 1080p", "dash");
      }
    }

    // 2. Standard HLS & DASH
    ["high", "base", "main"].forEach((q) => {
      const labelQual = q === "high" ? "1080p" : q === "base" ? "720p" : "480p";
      if (streamObj.hls && streamObj.hls[q]) {
        addStream(streamObj.hls[q], `MX HLS ${labelQual}`, "m3u8");
      }
      if (streamObj.dash && streamObj.dash[q]) {
        addStream(streamObj.dash[q], `MX DASH ${labelQual}`, "dash");
      }
    });

    // 3. MXPlay Nested HLS & DASH
    if (streamObj.mxplay) {
      ["high", "base", "main"].forEach((q) => {
        const labelQual = q === "high" ? "1080p" : q === "base" ? "720p" : "480p";
        if (streamObj.mxplay.hls && streamObj.mxplay.hls[q]) {
          addStream(streamObj.mxplay.hls[q], `MX HLS ${labelQual}`, "m3u8");
        }
        if (streamObj.mxplay.dash && streamObj.mxplay.dash[q]) {
          addStream(streamObj.mxplay.dash[q], `MX DASH ${labelQual}`, "dash");
        }
      });
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
