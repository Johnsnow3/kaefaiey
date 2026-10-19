import { Stream, ProviderContext } from "../types";

const ENDPOINT_URL = "https://d3sgzbosmwirao.cloudfront.net/";
const API_URL = "https://api.mxplayer.in/v1/web";
const desktopParams =
  "device-density=2&platform=com.mxplay.desktop&content-languages=hi,en,te,ta,kn,ml,mr,bn,gu,pa&kids-mode-enabled=false";

const defaultHeaders = {
  Referer: "https://www.mxplayer.in/",
  Origin: "https://www.mxplayer.in",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
};

function normalizeUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return ENDPOINT_URL + url.replace(/^\/+/, "");
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

  let streamObj: any = null;
  let videoHash: string | null = null;

  // ===============================
  // CASE 1: TV / Episode (JSON link)
  // ===============================
  if (link.startsWith("{")) {
    try {
      const data = JSON.parse(link);
      streamObj = data.stream || null;
      videoHash = data.videoHash || null;
    } catch (e) {
      console.error("Failed to parse stream JSON:", e);
    }
  }

  // ===============================
  // CASE 2: URL OR RAW ID
  // ===============================
  else {
    try {
      const isShow = link.includes("/tvshow/") || link.includes("/show/") || type === "series";

      // Match 32-character hex ID (e.g. bdc097c9e69456d31d767fa64dc41f28)
      const hexMatch = link.match(/([a-f0-9]{32})/i);
      const id = hexMatch ? hexMatch[1] : null;

      if (id && !isShow) {
        // ── Movie Stream Extraction ──
        let movieTitle = "";

        // 1. Video Details REST API
        try {
          const videoApi = `${API_URL}/detail/video?id=${id}&type=movie&${desktopParams}`;
          const res = await axios.get(videoApi, { headers: defaultHeaders, timeout: 6000 });
          if (res.data) {
            movieTitle = res.data.title || "";
            streamObj = res.data.stream || null;
            const raw = JSON.stringify(res.data);
            const hMatch = raw.match(/video\/([a-f0-9]{64})\//i);
            if (hMatch) videoHash = hMatch[1];
          }
        } catch (err: any) {
          console.warn("MX detail/video request failed:", err.message);
        }

        // 2. Search by Title Fallback (Search results contain full stream object)
        const hasDirectStream =
          streamObj &&
          (streamObj.hls || streamObj.dash || streamObj.thirdParty || streamObj.mxplay);

        if (!hasDirectStream && movieTitle) {
          try {
            const searchUrl = `${API_URL}/search/resultv2?query=${encodeURIComponent(movieTitle)}&${desktopParams}`;
            const sRes = await axios.post(searchUrl, {}, { headers: defaultHeaders, timeout: 6000 });
            const sections = sRes.data?.sections || [];
            for (const s of sections) {
              const item = (s.items || []).find((it: any) => it.id === id);
              if (item?.stream) {
                streamObj = item.stream;
                break;
              }
            }
          } catch (err: any) {
            console.warn("MX search stream fallback failed:", err.message);
          }
        }

        // 3. Fallback: Movie Recommended Endpoint
        if (!streamObj || (!streamObj.hls && !streamObj.thirdParty && !streamObj.mxplay)) {
          try {
            const apiUrl = `${API_URL}/detail/tab/movierecommended?type=movie&id=${id}&${desktopParams}`;
            const res = await axios.get(apiUrl, { headers: defaultHeaders, timeout: 5000 });
            const items = res.data?.items || [];
            const directMatch = items.find((it: any) => it.id === id);
            if (directMatch?.stream) {
              streamObj = directMatch.stream;
            }
          } catch {}
        }
      } else if (id && isShow) {
        // ── TV Show / Series Stream Extraction ──
        let seasonId = id;
        try {
          const seasonsUrl = `${API_URL}/detail/tab/tvshowseasons?type=tvshow&id=${id}&${desktopParams}`;
          const sRes = await axios.get(seasonsUrl, { headers: defaultHeaders, timeout: 6000 });
          const items = sRes.data?.items || [];
          const season1 = items.find((s: any) => s.sequence === 1) || items[0];
          if (season1?.id) {
            seasonId = season1.id;
          }
        } catch {}

        try {
          const epApi = `${API_URL}/detail/tab/tvshowepisodes?type=season&id=${seasonId}&sortOrder=0&${desktopParams}`;
          const epRes = await axios.get(epApi, { headers: defaultHeaders, timeout: 6000 });
          const items = epRes.data?.items || [];
          streamObj = items[0]?.stream || null;
          if (items[0]?.videoHash) {
            videoHash = items[0].videoHash;
          } else {
            const raw = JSON.stringify(items[0] || {});
            const hMatch = raw.match(/video\/([a-f0-9]{64})\//i);
            if (hMatch) videoHash = hMatch[1];
          }
        } catch {}
      }
    } catch (e) {
      console.error("MX Stream resolution error:", e);
    }
  }

  // ===============================
  // STREAM EXTRACTION (COMMON)
  // ===============================
  if (streamObj) {
    // 1. Third-party direct stream (Prime / CloudFront syndication)
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

    if (streamObj.videoHash) {
      videoHash = streamObj.videoHash;
    }
  }

  // 4. Direct videoHash CloudFront CDN Fallback
  // If API geoblocked the stream object, construct direct CloudFront CDN streams from the videoHash
  if (streamLinks.length === 0 && videoHash) {
    addStream(
      `https://d3sgzbosmwirao.cloudfront.net/video/${videoHash}/3/hls/h264_high.m3u8`,
      "MX HLS 1080p",
      "m3u8"
    );
    addStream(
      `https://d3sgzbosmwirao.cloudfront.net/video/${videoHash}/3/dash/h264_high.mpd`,
      "MX DASH 1080p",
      "dash"
    );
    addStream(
      `https://d3sgzbosmwirao.cloudfront.net/video/${videoHash}/1/hls/h264_high.m3u8`,
      "MX HLS (Direct) 1080p",
      "m3u8"
    );
  }

  return streamLinks;
};
