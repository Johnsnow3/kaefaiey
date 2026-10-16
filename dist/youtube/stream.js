"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// providers/youtube/stream.ts
var stream_exports = {};
__export(stream_exports, {
  getStream: () => getStream
});

function extractVideoId(link) {
  const match = link.match(/(?:v=|\/watch\?v=|\/embed\/|\/v\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/i) || link.match(/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : link;
}
__name(extractVideoId, "extractVideoId");
var QUALITY_ORDER = {
  "2160": 1,
  "1440": 2,
  "1080": 3,
  "720": 4,
  "480": 5,
  "360": 6,
  "240": 7,
  "144": 8
};
function getVisitorData(axios, kvStore) {
  return __async(this, null, function* () {
    const fallback = "CgtSdHczNXdoNzhqQSiYoJ7WBjIKCgJJThIEGgAgZGLfAgrcAjIyLllUPUpQRHNlLWd6ZzYwc3FRN2JRSGNlMzdJWHFlelQxLUZMd00yR3M5X1gxZUd4RWtRdUxyakphLS1iaU1LMk9fcU83MHl4cExXcFRKd3p2ckcxcGMyU0RBS3FmYXVPOGpnd1dpWUtUdU5rQ1pZZzFZeHh3UkFnRXYtNE9YR1gtaWhvd2RvblQ3dENIV0NmdDgtZU9Ibi04M2QtUlBoZlhoZGpyNjE4YlFGY0VWVU5UanJBZ2g0cVFCRXJWbktnQm4tV1Eydm1CNE5qTl9FajBQVV9TaFlsYkxEOGY3WFJaUGVNRnIzTzhoejEyMDJQQlJpRUwyX1gtV2N0WG1YRmFvLVYyZXRpTWJDSUZLaU9jNEZUTU1lSktrWVBKV1A0WlV5eFZYeTNPZUlFMS1XeXpaa1Y3T1dVVDE5SllHcTNSN0NFcE5HNTNFZElmcW9UVDdMYjV2N09mdw==";
    try {
      const cached = yield kvStore == null ? void 0 : kvStore.get("youtube_visitor_data");
      if (cached) return cached;
      const res = yield axios.get("https://www.youtube.com", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        timeout: 3e3
      });
      const match = typeof (res == null ? void 0 : res.data) === "string" ? res.data.match(/"visitorData"\s*:\s*"([^"]+)"/) : null;
      if (match && match[1]) {
        yield kvStore == null ? void 0 : kvStore.set("youtube_visitor_data", match[1]);
        return match[1];
      }
    } catch (e) {
    }
    return fallback;
  });
}
__name(getVisitorData, "getVisitorData");
function extractCaptions(data) {
  var _a, _b, _c, _d, _e, _f;
  const subtitles = [];
  const captionTracks = (_b = (_a = data == null ? void 0 : data.captions) == null ? void 0 : _a.playerCaptionsTracklistRenderer) == null ? void 0 : _b.captionTracks;
  if (Array.isArray(captionTracks)) {
    for (const c of captionTracks) {
      if (c.baseUrl) {
        const name = ((_e = (_d = (_c = c.name) == null ? void 0 : _c.runs) == null ? void 0 : _d[0]) == null ? void 0 : _e.text) || ((_f = c.name) == null ? void 0 : _f.simpleText) || c.languageCode;
        subtitles.push({
          title: name,
          language: c.languageCode || name,
          type: "text/vtt",
          uri: c.baseUrl.includes("fmt=") ? c.baseUrl : `${c.baseUrl}&fmt=vtt`
        });
      }
    }
  }
  return subtitles;
}
__name(extractCaptions, "extractCaptions");
function fetchFromInnerTube(axios, kvStore, videoId, signal) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d;
    const streams = [];
    let subtitles = [];
    const visitorData = yield getVisitorData(axios, kvStore);
    try {
      const [visionRes, vrRes] = yield Promise.allSettled([
        axios.post(
          "https://www.youtube.com/youtubei/v1/player?prettyPrint=false&alt=json",
          {
            videoId,
            racyCheckOk: true,
            contentCheckOk: true,
            playbackContext: {
              contentPlaybackContext: {
                signatureTimestamp: 20731
              }
            },
            context: {
              client: {
                hl: "en",
                gl: "US",
                visitorData,
                clientName: "VISIONOS",
                clientVersion: "1.02",
                osName: "visionOS",
                osVersion: "26.5.23O471",
                platform: "MOBILE",
                deviceMake: "Apple",
                deviceModel: "RealityDevice17,1"
              }
            }
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-YouTube-Client-Name": "101",
              "X-YouTube-Client-Version": "1.02",
              "X-Goog-Visitor-Id": visitorData,
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
              Origin: "https://www.youtube.com",
              Referer: `https://www.youtube.com/watch?v=${videoId}`
            },
            timeout: 5e3,
            signal
          }
        ),
        axios.post(
          "https://www.youtube.com/youtubei/v1/player?prettyPrint=false&alt=json",
          {
            videoId,
            racyCheckOk: true,
            contentCheckOk: true,
            playbackContext: {
              contentPlaybackContext: {
                signatureTimestamp: 20731
              }
            },
            context: {
              client: {
                clientName: "ANDROID_VR",
                clientVersion: "1.60.19",
                deviceMake: "Oculus",
                deviceModel: "Quest 3",
                platform: "MOBILE",
                hl: "en",
                gl: "US"
              }
            }
          },
          {
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Linux; Android 12; Quest 3) AppleWebKit/537.36"
            },
            timeout: 5e3,
            signal
          }
        )
      ]);
      const vData = visionRes.status === "fulfilled" ? (_a = visionRes.value) == null ? void 0 : _a.data : null;
      const vrData = vrRes.status === "fulfilled" ? (_b = vrRes.value) == null ? void 0 : _b.data : null;
      const masterUrl = (_c = vData == null ? void 0 : vData.streamingData) == null ? void 0 : _c.hlsManifestUrl;
      if (masterUrl) {
        streams.push({
          server: "YouTube HLS (Multi-Quality)",
          link: masterUrl,
          type: "m3u8",
          quality: "1080",
          tag: "Audio + Video"
        });
      }
      const formats = ((_d = vrData == null ? void 0 : vrData.streamingData) == null ? void 0 : _d.formats) || [];
      for (const f of formats) {
        if (f.url) {
          const qualityLabel = f.qualityLabel || "360p";
          streams.push({
            server: `YouTube (${qualityLabel} MP4)`,
            link: f.url,
            type: "mp4",
            quality: qualityLabel.replace("p", ""),
            tag: "Audio + Video"
          });
        }
      }
      subtitles = extractCaptions(vData) || extractCaptions(vrData) || [];
    } catch (e) {
    }
    return { streams, subtitles };
  });
}
__name(fetchFromInnerTube, "fetchFromInnerTube");
function sortStreams(streams, preferredQuality, isDownload) {
  streams.sort((a, b) => {
    if (isDownload) {
      const aIsMp4 = a.type === "mp4";
      const bIsMp4 = b.type === "mp4";
      if (aIsMp4 && !bIsMp4) return -1;
      if (!aIsMp4 && bIsMp4) return 1;
    }
    if (!isDownload) {
      const aIsHls = a.server.includes("Multi-Quality") || a.type === "m3u8";
      const bIsHls = b.server.includes("Multi-Quality") || b.type === "m3u8";
      if (aIsHls && !bIsHls) return -1;
      if (!aIsHls && bIsHls) return 1;
    }
    if (preferredQuality && preferredQuality !== "auto") {
      const cleanPref = preferredQuality.replace("p", "");
      const aMatches = a.quality === cleanPref;
      const bMatches = b.quality === cleanPref;
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
    }
    const orderA = QUALITY_ORDER[a.quality || ""] || 99;
    const orderB = QUALITY_ORDER[b.quality || ""] || 99;
    return orderA - orderB;
  });
}
__name(sortStreams, "sortStreams");
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    signal,
    providerContext,
    isDownload
  }) {
    const { axios, kvStore } = providerContext;
    const videoId = extractVideoId(link);
    if (!videoId) return [];
    const preferredQuality = yield kvStore == null ? void 0 : kvStore.get("preferredQuality");
    const { streams, subtitles } = yield fetchFromInnerTube(
      axios,
      kvStore,
      videoId,
      signal
    );
    if (streams.length === 0) {
      return [];
    }
    const seenUrls = /* @__PURE__ */ new Set();
    const uniqueStreams = [];
    for (const s of streams) {
      if (!seenUrls.has(s.link)) {
        seenUrls.add(s.link);
        uniqueStreams.push(s);
      }
    }
    if (subtitles.length > 0) {
      for (const s of uniqueStreams) {
        if (!s.subtitles) {
          s.subtitles = subtitles;
        }
      }
    }
    sortStreams(uniqueStreams, preferredQuality, isDownload);
    return uniqueStreams;
  });
}, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

