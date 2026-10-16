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

// providers/everything/stream.ts
var stream_exports = {};
__export(stream_exports, {
  getStream: () => getStream
});

var TURNSTILE_INJECT_JS = `(function() {
  if (window.__vega_turnstile_injected) return;
  window.__vega_turnstile_injected = true;

  function init() {
    if (!document.body) {
      setTimeout(init, 50);
      return;
    }

    var container = document.getElementById('vega-turnstile-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vega-turnstile-container';
      container.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999999;background:#18181b;padding:24px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:300px;border:1px solid #333;font-family:system-ui,-apple-system,sans-serif;';
      
      var title = document.createElement('div');
      title.innerText = 'Security Verification';
      title.style.cssText = 'color:#fff;font-size:15px;font-weight:600;margin-bottom:8px;text-align:center;';
      container.appendChild(title);

      var subtitle = document.createElement('div');
      subtitle.innerText = 'Please wait or verify below to load streams...';
      subtitle.style.cssText = 'color:#a1a1aa;font-size:13px;margin-bottom:16px;text-align:center;';
      container.appendChild(subtitle);

      var widget = document.createElement('div');
      widget.id = 'vega-turnstile-widget';
      container.appendChild(widget);

      document.body.appendChild(container);
    }

    function renderWidget() {
      if (!window.turnstile || typeof window.turnstile.render !== 'function') return false;
      var widget = document.getElementById('vega-turnstile-widget');
      if (!widget || widget.children.length > 0) return true;
      try {
        window.turnstile.render(widget, {
          sitekey: '0x4AAAAAAE88TTCq-X3s3srZ',
          theme: 'dark',
          callback: function(token) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                __waf: true,
                data: token
              }));
            }
          },
          'error-callback': function() {
            console.error('Turnstile error');
          }
        });
        return true;
      } catch (err) {
        console.error('Turnstile render error', err);
        return false;
      }
    }

    if (window.turnstile && renderWidget()) {
      return;
    }

    if (!document.getElementById('vega-turnstile-script')) {
      var script = document.createElement('script');
      script.id = 'vega-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      document.head.appendChild(script);
    }

    var poll = setInterval(function() {
      if (window.turnstile && renderWidget()) {
        clearInterval(poll);
      }
    }, 100);
    setTimeout(function() { clearInterval(poll); }, 25000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(); true;`;
var DIRECT_REGEX = /(r2\.dev|workers\.dev|foxcloud\.rest|neetflixcdn|drive\.google\.com\/uc|video-downloads\.googleusercontent|vikingfile\.com\/download|download\d*\.mediafire|111477|sermoviedown|highxhd|archive\.org|uupload\.ir|hakunaymatata\.com|vadapav\.mov|tattooin\.ru|public\.animeout|nimbus\.animeout|mydriveku|dl\.anime7\.download|\.mkv($|\?)|\.mp4($|\?)|\.webm($|\?)|\.avi($|\?))/i;
var EXCLUDE_REGEX = /hubcloud|hubdrive|pixeldrain|telegram|t\.me|\.rar($|\?)|\.zip($|\?)/i;
function isDirectLink(url) {
  if (!url || typeof url !== "string") return false;
  if (EXCLUDE_REGEX.test(url)) return false;
  return DIRECT_REGEX.test(url);
}
__name(isDirectLink, "isDirectLink");
function normalizeStr(e) {
  return String(e || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
__name(normalizeStr, "normalizeStr");
function decodeAndClean(e) {
  let t = String(e || "");
  try {
    t = decodeURIComponent(t);
  } catch (e2) {
  }
  return t.replace(/[+_]/g, " ");
}
__name(decodeAndClean, "decodeAndClean");
function parseSeasonEpisodes(e) {
  const t = decodeAndClean(e);
  const n = [];
  const addEntry = /* @__PURE__ */ __name((s, ep, epFrom, epTo) => {
    const a = s == null ? null : Number(s);
    if (a != null && (!Number.isFinite(a) || a < 0 || a > 100)) return;
    if (ep != null) {
      const eNum = Number(ep);
      if (!Number.isFinite(eNum) || eNum < 1 || eNum > 999) return;
      n.push({ season: a, episode: eNum });
      return;
    }
    if (epFrom != null && epTo != null) {
      const eNum = Number(epFrom);
      const tNum = Number(epTo);
      if (!Number.isFinite(eNum) || !Number.isFinite(tNum)) return;
      n.push({ season: a, epFrom: Math.min(eNum, tNum), epTo: Math.max(eNum, tNum) });
      return;
    }
    if (a != null) n.push({ season: a });
  }, "addEntry");
  for (const match of t.matchAll(/\bS(\d{1,2})E(\d{1,3})\s*[-–to]+\s*E?(\d{1,3})\b/gi)) {
    addEntry(match[1], null, match[2], match[3]);
  }
  for (const match of t.matchAll(/\bS(\d{1,2})E(\d{1,3})\b/gi)) {
    addEntry(match[1], match[2], null, null);
  }
  for (const match of t.matchAll(/\bS(\d{1,2})[.\s_-]+E(\d{1,3})\b/gi)) {
    addEntry(match[1], match[2], null, null);
  }
  for (const match of t.matchAll(/\b(\d{1,2})x(\d{1,3})\b/gi)) {
    addEntry(match[1], match[2], null, null);
  }
  for (const match of t.matchAll(
    /\bSeasons?\s*(\d{1,2})\s*(?:[-–:]\s*)?(?:Episode|Episodes|Ep)\s*(\d{1,3})\b/gi
  )) {
    addEntry(match[1], match[2], null, null);
  }
  for (const match of t.matchAll(
    /\bSeasons?\s*(\d{1,2})\b[^.\n]{0,40}?\b(?:Episode|Episodes|Ep)\s*(\d{1,3})\s*[-–to]+\s*(\d{1,3})\b/gi
  )) {
    addEntry(match[1], null, match[2], match[3]);
  }
  for (const match of t.matchAll(/\bSeasons?\s*(\d{1,2})\b/gi)) {
    addEntry(match[1], null, null, null);
  }
  for (const match of t.matchAll(/\bS(\d{1,2})(?!\d|E\d)\b/gi)) {
    addEntry(match[1], null, null, null);
  }
  return n;
}
__name(parseSeasonEpisodes, "parseSeasonEpisodes");
function titleMatch(e, t) {
  const n = normalizeStr(t);
  const r = normalizeStr(e);
  if (!n || !r) return false;
  if (r.includes(n)) return true;
  const i = n.split(" ").filter((w) => w.length > 2);
  return i.length ? i.filter((w) => r.includes(w)).length >= Math.ceil(i.length * 0.75) : r.includes(n.replace(/\s/g, ""));
}
__name(titleMatch, "titleMatch");
function extractMismatchedTitle(e, t) {
  const match = String(e || "").match(
    /([A-Za-z][A-Za-z0-9 .'_-]{1,48}?)(?:\s*[._-]?\s*)(?:S\d{1,2}|Seasons?\s*\d{1,2})\b/i
  );
  if (!match) return "";
  const r = normalizeStr(match[1]);
  if (!r || r.length < 3 || /^(web|webdl|webrip|bluray|hdtv|hdrip|complete|pack|english|hindi|dual|multi|download|episode|season|series)$/i.test(
    r
  ) || titleMatch(r, t) || titleMatch(t, r) || normalizeStr(t).split(" ").filter((w) => w.length > 3).some((w) => r.includes(w))) {
    return "";
  }
  return r;
}
__name(extractMismatchedTitle, "extractMismatchedTitle");
function isPossibleWrongFile(item, target) {
  if (!target) return false;
  const isSeries = target.type === "series" || target.season != null || target.episode != null;
  const text = [item.name, ...item.tags || [], item.url].filter(Boolean).join(" ");
  if (!text.trim()) return false;
  const parsed = parseSeasonEpisodes(text);
  const withEpisode = parsed.filter(
    (e) => e.episode != null || e.epFrom != null && e.epTo != null
  );
  const withSeason = parsed.filter((e) => e.season != null);
  if (isSeries) {
    const n = target.season == null ? null : Number(target.season);
    const r = target.episode == null ? null : Number(target.episode);
    const title = target.title || "";
    const matchesTarget = /* @__PURE__ */ __name((e) => {
      if (n != null && e.season != null && Number(e.season) !== n) return false;
      if (e.episode == null) {
        if (e.epFrom != null && e.epTo != null) {
          return r == null || r >= e.epFrom && r <= e.epTo;
        }
        return true;
      }
      return r == null || Number(e.episode) === r;
    }, "matchesTarget");
    if (r != null && withEpisode.length > 0) {
      if (!withEpisode.some(matchesTarget)) return true;
    } else if (r != null && withSeason.length > 0 && withEpisode.length === 0) {
      if (n != null && !withSeason.some((e) => Number(e.season) === n)) return true;
    } else if (n != null && withSeason.length > 0 && withEpisode.length === 0) {
      if (!withSeason.some((e) => Number(e.season) === n)) return true;
    } else if (n != null && withEpisode.length > 0 && r == null && withEpisode.every((e) => e.season != null && Number(e.season) !== n)) {
      return true;
    }
    if (title && (n != null || r != null) && withSeason.length > 0) {
      if (!titleMatch(text, title) && Boolean(extractMismatchedTitle(text, title))) {
        return true;
      }
    }
  } else {
    if (withEpisode.length > 0 || withSeason.length > 0) return true;
  }
  return false;
}
__name(isPossibleWrongFile, "isPossibleWrongFile");
function extractQuality(tags, name) {
  const all = [...tags || [], name].join(" ");
  if (/2160p|4k|uhd/i.test(all)) return "2160";
  if (/1080p/i.test(all)) return "1080";
  if (/720p/i.test(all)) return "720";
  if (/480p/i.test(all)) return "480";
  if (/360p/i.test(all)) return "360";
  return void 0;
}
__name(extractQuality, "extractQuality");
function extractType(url, name) {
  if (/\.mp4($|\?)/i.test(url) || /\.mp4/i.test(name)) return "mp4";
  if (/\.m3u8($|\?)/i.test(url)) return "m3u8";
  return "mkv";
}
__name(extractType, "extractType");
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    type,
    signal,
    providerContext,
    isDownload
  }) {
    var _a, _b;
    try {
      let params = {};
      try {
        params = JSON.parse(link);
      } catch (e) {
        params = {};
      }
      const isSeries = params.type === "series" || type === "series" || Boolean(params.season || params.episode);
      let payload;
      if (isSeries) {
        payload = {
          mode: "episode",
          title: params.title || "",
          year: params.year ? params.year.toString().slice(0, 4) : void 0,
          tmdb_id: params.tmdbId ? parseInt(params.tmdbId, 10) : void 0,
          imdb_id: params.imdbId || void 0,
          season: params.season ? parseInt(params.season, 10) : void 0,
          episode: params.episode ? parseInt(params.episode, 10) : void 0
        };
      } else {
        payload = {
          mode: "movie",
          title: params.title || "",
          year: params.year ? params.year.toString().slice(0, 4) : void 0,
          tmdb_id: params.tmdbId ? parseInt(params.tmdbId, 10) : void 0,
          imdb_id: params.imdbId || void 0
        };
      }
      const headers = {
        accept: "application/x-ndjson",
        "accept-language": "en-US,en;q=0.8",
        "cache-control": "no-cache",
        "content-type": "application/json",
        origin: "https://downloadeverythingfromeverywhere.com",
        pragma: "no-cache",
        referer: "https://downloadeverythingfromeverywhere.com/",
        "user-agent": ((_a = providerContext.commonHeaders) == null ? void 0 : _a["User-Agent"]) || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "x-defe-manual": "1"
      };
      const fetchStreams = /* @__PURE__ */ __name((bodyPayload) => __async(null, null, function* () {
        const response = yield providerContext.axios.post(
          "https://slave.downloadeverythingfromeverywhere.com/",
          bodyPayload,
          {
            headers,
            responseType: "text",
            signal,
            timeout: 45e3
          }
        );
        return typeof response.data === "string" ? response.data : JSON.stringify(response.data);
      }), "fetchStreams");
      let rawData = "";
      try {
        rawData = yield fetchStreams(payload);
      } catch (err) {
        if (err.response) {
          rawData = typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data || "");
        } else {
          throw err;
        }
      }
      if ((rawData.includes('"verify failed"') || rawData.includes('"error"')) && providerContext.openWebView) {
        try {
          const wafResult = yield providerContext.openWebView(
            "https://downloadeverythingfromeverywhere.com/",
            {
              title: "Security Verification",
              description: "Please complete the verification to load streams",
              force: true,
              injectedJavaScript: TURNSTILE_INJECT_JS
            }
          );
          const token = (_b = wafResult == null ? void 0 : wafResult.data) == null ? void 0 : _b.trim();
          if (token && !token.startsWith("<") && !token.startsWith("{")) {
            payload.turnstile = token;
            rawData = yield fetchStreams(payload);
          }
        } catch (wafErr) {
          console.error("Turnstile WAF solving failed or cancelled:", wafErr);
        }
      }
      const lines = rawData.split("\n").filter((l) => l.trim().length > 0);
      const streams = [];
      const seenUrls = /* @__PURE__ */ new Set();
      const target = {
        title: params.title || "",
        season: params.season,
        episode: params.episode,
        type: isSeries ? "series" : "movie"
      };
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.t === "hit" && Array.isArray(json.links)) {
            const site = json.site || "Direct";
            for (const item of json.links) {
              const url = item.url;
              if (!url || seenUrls.has(url)) continue;
              if (isPossibleWrongFile({ name: item.name, tags: item.tags, url }, target)) {
                continue;
              }
              if (isDirectLink(url)) {
                seenUrls.add(url);
                const quality = extractQuality(item.tags, item.name);
                const fileType = extractType(url, item.name);
                const name = item.name || item.release || "Stream";
                const server = `${site} - ${name}`;
                const QUALITY_TAG_REGEX = /^(2160p?|1080p?|720p?|540p?|480p?|400p?|360p?|4k|uhd)$/i;
                const cleanTags = (item.tags || []).filter(
                  (t) => t && !["Movie", "Episode", site, "Direct"].includes(t) && !t.toLowerCase().includes("telegram") && !QUALITY_TAG_REGEX.test(t.trim()) && (!quality || t.trim().toLowerCase() !== quality.toLowerCase() && t.trim().toLowerCase() !== (quality + "p").toLowerCase())
                );
                streams.push({
                  server,
                  link: url,
                  type: fileType,
                  quality,
                  tags: cleanTags,
                  tag: cleanTags.join(" \u2022 ") || void 0
                });
              }
            }
          }
        } catch (e) {
        }
      }
      const isA111477 = /* @__PURE__ */ __name((s) => {
        var _a2;
        return /111477/i.test(s.server) || /111477/i.test(s.link) || Boolean((_a2 = s.tags) == null ? void 0 : _a2.some((t) => /111477/i.test(t)));
      }, "isA111477");
      const qualityWeight = /* @__PURE__ */ __name((q) => {
        switch (q) {
          case "2160":
            return 4;
          case "1080":
            return 3;
          case "720":
            return 2;
          case "480":
            return 1;
          default:
            return 0;
        }
      }, "qualityWeight");
      const regularStreams = [];
      const a111477Streams = [];
      for (const stream of streams) {
        if (isA111477(stream)) {
          a111477Streams.push(stream);
        } else {
          regularStreams.push(stream);
        }
      }
      regularStreams.sort((a, b) => qualityWeight(b.quality) - qualityWeight(a.quality));
      a111477Streams.sort((a, b) => qualityWeight(b.quality) - qualityWeight(a.quality));
      return [...regularStreams, ...a111477Streams];
    } catch (err) {
      console.error("Everything getStream error:", err);
      return [];
    }
  });
}, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

