"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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

// providers/kickAssAnime/stream.ts
var stream_exports = {};
__export(stream_exports, {
  getStream: () => getStream
});

var BASE_URL = "https://kaa.lt";
var defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*"
};
function fixUrl(rawUrl, baseUrl) {
  let trimmed = rawUrl.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    trimmed = trimmed.replace(/^(https?:)\/\/+/, "$1//");
  } else if (trimmed.startsWith("//")) {
    trimmed = "https:" + trimmed;
  } else if (trimmed.startsWith("/")) {
    try {
      const u = new URL(baseUrl);
      trimmed = `${u.origin}${trimmed}`;
    } catch (e) {
      trimmed = `${BASE_URL}${trimmed}`;
    }
  }
  return trimmed;
}
__name(fixUrl, "fixUrl");
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c, _d;
    const { axios } = providerContext;
    let epApiUrl = link;
    let epParsed = null;
    if (link.startsWith("{")) {
      try {
        const parsed = JSON.parse(link);
        epParsed = parsed;
        const slug = parsed.slug;
        const epNum = parsed.epNum;
        const epSlug = parsed.epSlug;
        const num = epNum || "1";
        epApiUrl = epSlug ? `${BASE_URL}/api/show/${slug}/episode/ep-${num}-${epSlug}` : `${BASE_URL}/api/show/${slug}/episode/ep-${num}`;
      } catch (e) {
      }
    }
    let servers = [];
    try {
      const srvRes = yield axios.get(epApiUrl, { headers: defaultHeaders });
      servers = ((_a = srvRes.data) == null ? void 0 : _a.servers) || [];
      if (servers.length === 0 && (epParsed == null ? void 0 : epParsed.slug) && epParsed.lang && epParsed.lang !== "ja-JP") {
        try {
          const num = epParsed.epNum || "1";
          const jaRes = yield axios.get(
            `${BASE_URL}/api/show/${epParsed.slug}/episodes?page=1&lang=ja-JP`,
            { headers: defaultHeaders }
          );
          const jaEps = ((_b = jaRes.data) == null ? void 0 : _b.result) || [];
          const matching = jaEps.find(
            (e) => String(e.episode_string) === String(num) || String(e.episode_number) === String(num)
          );
          if (matching == null ? void 0 : matching.slug) {
            const fallbackRes = yield axios.get(
              `${BASE_URL}/api/show/${epParsed.slug}/episode/ep-${num}-${matching.slug}`,
              { headers: defaultHeaders }
            );
            servers = ((_c = fallbackRes.data) == null ? void 0 : _c.servers) || [];
          }
        } catch (e) {
        }
      }
    } catch (e) {
      return [];
    }
    if (servers.length === 0) {
      return [];
    }
    const streams = [];
    for (const srv of servers) {
      if (!srv.src) continue;
      try {
        let src = srv.src;
        if (src.includes("/cat-player/vast")) {
          src = src.replace("/cat-player/vast", "/cat-player/player");
        }
        const playerUrl = fixUrl(src, BASE_URL);
        const playerRes = yield axios.get(playerUrl, {
          headers: __spreadProps(__spreadValues({}, defaultHeaders), {
            Referer: `${BASE_URL}/`
          })
        });
        const html = typeof playerRes.data === "string" ? playerRes.data : JSON.stringify(playerRes.data);
        const cleanHtml = html.replace(/&quot;/g, '"');
        const manifestMatch = cleanHtml.match(/manifest":\[\d+,"(?:https?:)?(\/\/[^"]+)"]/);
        const directManifestMatch = manifestMatch || cleanHtml.match(/manifest":\[\d+,"([^"]+)"]/);
        if (directManifestMatch) {
          const rawManifest = directManifestMatch[1].split("\\").join("");
          const manifestUrl = fixUrl(rawManifest, playerUrl);
          let origin = "";
          try {
            origin = new URL(playerUrl).origin;
          } catch (e) {
            origin = BASE_URL;
          }
          const hlsHeaders = {
            "User-Agent": defaultHeaders["User-Agent"],
            Origin: origin,
            Referer: playerUrl
          };
          const subtitles = [];
          const trackRegex = /"language":\[\d+,"([^"]+)"][^}]+?"name":\[\d+,"([^"]+)"][^}]+?"src":\[\d+,"([^"]+)"]/g;
          let tMatch;
          while ((tMatch = trackRegex.exec(cleanHtml)) !== null) {
            const lang = tMatch[1];
            const subName = tMatch[2];
            const subSrc = tMatch[3].split("\\").join("");
            const subUrl = fixUrl(subSrc, playerUrl);
            const proxyUrl = `https://fetch.1proxy.workers.dev/fetch?url=${encodeURIComponent(
              subUrl
            )}&headers=${encodeURIComponent(JSON.stringify(hlsHeaders))}`;
            const isSrt = subUrl.toLowerCase().includes(".srt");
            subtitles.push({
              title: `${subName} (${lang})`,
              language: lang,
              type: isSrt ? "application/x-subrip" : "text/vtt",
              uri: proxyUrl
            });
          }
          if (manifestUrl.includes(".m3u8")) {
            streams.push({
              server: `${srv.name} (Auto)`,
              link: manifestUrl,
              type: "m3u8",
              quality: "auto",
              subtitles: subtitles.length > 0 ? subtitles : void 0,
              headers: hlsHeaders
            });
            try {
              const m3u8Res = yield axios.get(manifestUrl, { headers: hlsHeaders });
              const lines = m3u8Res.data.split("\n");
              const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf("/") + 1);
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith("#EXT-X-STREAM-INF")) {
                  const resMatch = line.match(/RESOLUTION=\d+x(\d+)/);
                  const quality = resMatch ? `${resMatch[1]}p` : "unknown";
                  const nextLine = (_d = lines[i + 1]) == null ? void 0 : _d.trim();
                  if (nextLine && !nextLine.startsWith("#")) {
                    const streamUrl = nextLine.startsWith("http") ? nextLine : baseUrl + nextLine;
                    streams.push({
                      server: `${srv.name} (${quality})`,
                      link: streamUrl,
                      type: "m3u8",
                      quality,
                      subtitles: subtitles.length > 0 ? subtitles : void 0,
                      headers: hlsHeaders
                    });
                  }
                }
              }
            } catch (e) {
            }
          } else if (manifestUrl.includes(".mpd") || playerUrl.includes("type=dash")) {
            streams.push({
              server: `${srv.name} (DASH)`,
              link: manifestUrl,
              type: "dash",
              quality: "auto",
              subtitles: subtitles.length > 0 ? subtitles : void 0,
              headers: hlsHeaders
            });
          }
          continue;
        }
        const sourcesMatch = cleanHtml.match(/sources:\s*(\[[^\]]+\])/);
        if (sourcesMatch) {
          try {
            const sources = JSON.parse(sourcesMatch[1]);
            for (const s of sources) {
              if (s.file) {
                const streamUrl = fixUrl(s.file, playerUrl);
                streams.push({
                  server: `${srv.name} (${s.label || "default"})`,
                  link: streamUrl,
                  type: streamUrl.includes(".m3u8") ? "m3u8" : "mp4",
                  quality: s.label || "unknown"
                });
              }
            }
          } catch (e) {
          }
        }
      } catch (e) {
      }
    }
    return streams;
  });
}, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

