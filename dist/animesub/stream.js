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

// providers/animesub/stream.ts
var stream_exports = {};
__export(stream_exports, {
  getStream: () => getStream
});


// providers/providerErrors.ts
function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch (e) {
    return String(error);
  }
}
__name(getErrorMessage, "getErrorMessage");
function throwProviderError(provider, operation, error) {
  var _a, _b;
  const response = error == null ? void 0 : error.response;
  const status = response == null ? void 0 : response.status;
  const statusText = response == null ? void 0 : response.statusText;
  const url = ((_a = response == null ? void 0 : response.config) == null ? void 0 : _a.url) || ((_b = error == null ? void 0 : error.config) == null ? void 0 : _b.url);
  const details = [
    status ? `HTTP ${status}${statusText ? ` ${statusText}` : ""}` : "",
    url ? `URL ${url}` : "",
    getErrorMessage(error)
  ].filter(Boolean);
  throw new Error(`${provider} ${operation} failed: ${details.join(" | ")}`);
}
__name(throwProviderError, "throwProviderError");

// providers/theintrodb.ts
function getIntroDbCache() {
  const state = typeof providerGlobal !== "undefined" && providerGlobal ? providerGlobal : globalThis;
  if (!state.__vegaTheIntroDbCache__ || typeof state.__vegaTheIntroDbCache__ !== "object") {
    state.__vegaTheIntroDbCache__ = /* @__PURE__ */ Object.create(null);
  }
  return state.__vegaTheIntroDbCache__;
}
__name(getIntroDbCache, "getIntroDbCache");
function fetchTheIntroDbSkipTimings(_0) {
  return __async(this, arguments, function* ({
    imdbId,
    tmdbId,
    season,
    episode,
    providerContext,
    signal,
    timeout = 4e3
  }) {
    if (!imdbId && !tmdbId) return [];
    if (!season || !episode || season < 1 || episode < 1) return [];
    const cache = getIntroDbCache();
    const cacheKey = `${imdbId || tmdbId}:${season}:${episode}`;
    const cached = cache[cacheKey];
    if (cached) {
      if (typeof cached.then === "function") {
        return cached;
      }
      return cached;
    }
    const params = new URLSearchParams();
    if (imdbId) params.set("imdb_id", imdbId);
    if (tmdbId) params.set("tmdb_id", tmdbId.toString());
    params.set("season", season.toString());
    params.set("episode", episode.toString());
    const fetchPromise = (() => __async(null, null, function* () {
      var _a, _b, _c;
      try {
        const url = `https://api.theintrodb.org/v2/media?${params.toString()}`;
        const res = yield providerContext.axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
            Accept: "application/json"
          },
          timeout,
          signal
        });
        const data = res.data;
        if (!data || typeof data !== "object") {
          cache[cacheKey] = [];
          return [];
        }
        const skipIntervals = [];
        if (Array.isArray(data.intro)) {
          for (const item of data.intro) {
            const startMs = (_a = item == null ? void 0 : item.start_ms) != null ? _a : 0;
            const endMs = item == null ? void 0 : item.end_ms;
            if (typeof endMs === "number" && endMs > startMs) {
              skipIntervals.push({
                title: "Intro",
                from: Number((startMs / 1e3).toFixed(2)),
                to: Number((endMs / 1e3).toFixed(2))
              });
            }
          }
        }
        if (Array.isArray(data.recap)) {
          for (const item of data.recap) {
            const startMs = (_b = item == null ? void 0 : item.start_ms) != null ? _b : 0;
            const endMs = item == null ? void 0 : item.end_ms;
            if (typeof endMs === "number" && endMs > startMs) {
              skipIntervals.push({
                title: "Recap",
                from: Number((startMs / 1e3).toFixed(2)),
                to: Number((endMs / 1e3).toFixed(2))
              });
            }
          }
        }
        if (Array.isArray(data.credits)) {
          for (const item of data.credits) {
            const startMs = item == null ? void 0 : item.start_ms;
            const endMs = item == null ? void 0 : item.end_ms;
            if (typeof startMs === "number" && typeof endMs === "number" && endMs > startMs) {
              skipIntervals.push({
                title: "Credits",
                from: Number((startMs / 1e3).toFixed(2)),
                to: Number((endMs / 1e3).toFixed(2))
              });
            }
          }
        }
        if (Array.isArray(data.preview)) {
          for (const item of data.preview) {
            const startMs = (_c = item == null ? void 0 : item.start_ms) != null ? _c : 0;
            const endMs = item == null ? void 0 : item.end_ms;
            if (typeof endMs === "number" && endMs > startMs) {
              skipIntervals.push({
                title: "Preview",
                from: Number((startMs / 1e3).toFixed(2)),
                to: Number((endMs / 1e3).toFixed(2))
              });
            }
          }
        }
        cache[cacheKey] = skipIntervals;
        return skipIntervals;
      } catch (e) {
        delete cache[cacheKey];
        return [];
      }
    }))();
    cache[cacheKey] = fetchPromise;
    return fetchPromise;
  });
}
__name(fetchTheIntroDbSkipTimings, "fetchTheIntroDbSkipTimings");

// providers/aniskip.ts
function getAniSkipCache() {
  const state = typeof providerGlobal !== "undefined" && providerGlobal ? providerGlobal : globalThis;
  if (!state.__vegaAniSkipCache__ || typeof state.__vegaAniSkipCache__ !== "object") {
    state.__vegaAniSkipCache__ = /* @__PURE__ */ Object.create(null);
  }
  return state.__vegaAniSkipCache__;
}
__name(getAniSkipCache, "getAniSkipCache");
function resolveMalIdFromKitsu(kitsuId, providerContext, timeout = 5e3) {
  return __async(this, null, function* () {
    var _a, _b;
    const cleanKitsuId = kitsuId.replace(/^kitsu:/i, "").split(":")[0].trim();
    if (!cleanKitsuId || !/^\d+$/.test(cleanKitsuId)) return null;
    const cache = getAniSkipCache();
    const cacheKey = `kitsu_mal_${cleanKitsuId}`;
    if (cache[cacheKey] !== void 0) {
      return cache[cacheKey];
    }
    try {
      const url = `https://kitsu.io/api/edge/anime/${cleanKitsuId}/mappings`;
      const res = yield providerContext.axios.get(url, {
        headers: {
          Accept: "application/vnd.api+json"
        },
        timeout
      });
      const mappings = Array.isArray((_a = res.data) == null ? void 0 : _a.data) ? res.data.data : [];
      const malMapping = mappings.find(
        (m) => {
          var _a2;
          return ((_a2 = m.attributes) == null ? void 0 : _a2.externalSite) === "myanimelist/anime";
        }
      );
      const malId = ((_b = malMapping == null ? void 0 : malMapping.attributes) == null ? void 0 : _b.externalId) ? String(malMapping.attributes.externalId) : null;
      cache[cacheKey] = malId;
      return malId;
    } catch (e) {
      cache[cacheKey] = null;
      return null;
    }
  });
}
__name(resolveMalIdFromKitsu, "resolveMalIdFromKitsu");
function resolveKitsuIdFromMal(malId, providerContext, timeout = 5e3) {
  return __async(this, null, function* () {
    var _a, _b;
    const cleanMalId = String(malId).trim();
    if (!cleanMalId || !/^\d+$/.test(cleanMalId)) return null;
    const cache = getAniSkipCache();
    const cacheKey = `mal_kitsu_${cleanMalId}`;
    if (cache[cacheKey] !== void 0) {
      return cache[cacheKey];
    }
    try {
      const url = `https://kitsu.io/api/edge/mappings?filter[external_site]=myanimelist/anime&filter[external_id]=${cleanMalId}&include=item`;
      const res = yield providerContext.axios.get(url, {
        headers: {
          Accept: "application/vnd.api+json"
        },
        timeout
      });
      const kitsuItem = (_b = (_a = res.data) == null ? void 0 : _a.included) == null ? void 0 : _b[0];
      const kitsuId = (kitsuItem == null ? void 0 : kitsuItem.id) ? String(kitsuItem.id) : null;
      cache[cacheKey] = kitsuId;
      return kitsuId;
    } catch (e) {
      cache[cacheKey] = null;
      return null;
    }
  });
}
__name(resolveKitsuIdFromMal, "resolveKitsuIdFromMal");
function resolveMalIdFromTitle(title, providerContext, timeout = 5e3) {
  return __async(this, null, function* () {
    var _a, _b;
    const cleanTitle = title.trim();
    if (!cleanTitle) return null;
    const cache = getAniSkipCache();
    const cacheKey = `title_mal_${cleanTitle.toLowerCase()}`;
    if (cache[cacheKey] !== void 0) {
      return cache[cacheKey];
    }
    try {
      const url = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(
        cleanTitle
      )}&page[limit]=1&include=mappings`;
      const res = yield providerContext.axios.get(url, {
        headers: {
          Accept: "application/vnd.api+json"
        },
        timeout
      });
      const included = Array.isArray((_a = res.data) == null ? void 0 : _a.included) ? res.data.included : [];
      const malMapping = included.find(
        (m) => {
          var _a2;
          return ((_a2 = m.attributes) == null ? void 0 : _a2.externalSite) === "myanimelist/anime";
        }
      );
      const malId = ((_b = malMapping == null ? void 0 : malMapping.attributes) == null ? void 0 : _b.externalId) ? String(malMapping.attributes.externalId) : null;
      cache[cacheKey] = malId;
      return malId;
    } catch (e) {
      cache[cacheKey] = null;
      return null;
    }
  });
}
__name(resolveMalIdFromTitle, "resolveMalIdFromTitle");
function fetchAniSkipTimings(malId, episode, providerContext, signal, timeout = 4e3) {
  return __async(this, null, function* () {
    const numMalId = String(malId).trim();
    if (!numMalId || !episode || episode < 1) return [];
    const cache = getAniSkipCache();
    const cacheKey = `aniskip_${numMalId}_${episode}`;
    const cached = cache[cacheKey];
    if (cached) {
      if (typeof cached.then === "function") {
        return cached;
      }
      return cached;
    }
    const fetchPromise = (() => __async(null, null, function* () {
      try {
        const url = `https://api.aniskip.com/v2/skip-times/${numMalId}/${episode}?types=op&types=ed&types=recap&types=mixed-op&types=mixed-ed&episodeLength=0`;
        const res = yield providerContext.axios.get(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
          },
          timeout,
          signal
        });
        const data = res.data;
        if (!data || !data.found || !Array.isArray(data.results)) {
          cache[cacheKey] = [];
          return [];
        }
        const results = data.results;
        const intervals = [];
        const priorityMap = {
          recap: 1,
          op: 2,
          "mixed-op": 3,
          ed: 4,
          "mixed-ed": 5
        };
        const sortedResults = [...results].sort(
          (a, b) => (priorityMap[a.skipType] || 99) - (priorityMap[b.skipType] || 99)
        );
        const seenTypes = /* @__PURE__ */ new Set();
        for (const item of sortedResults) {
          const interval = item == null ? void 0 : item.interval;
          if (!interval) continue;
          const start = typeof interval.startTime === "number" ? interval.startTime : 0;
          const end = typeof interval.endTime === "number" ? interval.endTime : 0;
          if (end <= start) continue;
          let title = "Intro";
          let category = "op";
          if (item.skipType === "ed" || item.skipType === "mixed-ed") {
            title = "Credits";
            category = "ed";
          } else if (item.skipType === "recap") {
            title = "Recap";
            category = "recap";
          }
          if (seenTypes.has(category)) {
            continue;
          }
          seenTypes.add(category);
          intervals.push({
            title,
            from: Number(start.toFixed(2)),
            to: Number(end.toFixed(2))
          });
        }
        intervals.sort((a, b) => a.from - b.from);
        cache[cacheKey] = intervals;
        return intervals;
      } catch (e) {
        delete cache[cacheKey];
        return [];
      }
    }))();
    cache[cacheKey] = fetchPromise;
    return fetchPromise;
  });
}
__name(fetchAniSkipTimings, "fetchAniSkipTimings");
function fetchAnimeSkipTimings(_0) {
  return __async(this, arguments, function* ({
    kitsuId,
    title,
    malId,
    episode,
    providerContext,
    signal,
    timeout
  }) {
    if (!episode || episode < 1) return [];
    let resolvedMalId = malId;
    if (!resolvedMalId && kitsuId) {
      resolvedMalId = (yield resolveMalIdFromKitsu(kitsuId, providerContext)) || void 0;
    }
    if (!resolvedMalId && title) {
      resolvedMalId = (yield resolveMalIdFromTitle(title, providerContext)) || void 0;
    }
    if (resolvedMalId) {
      const timings = yield fetchAniSkipTimings(
        resolvedMalId,
        episode,
        providerContext,
        signal,
        timeout
      );
      if (timings.length > 0) {
        return timings;
      }
    }
    return [];
  });
}
__name(fetchAnimeSkipTimings, "fetchAnimeSkipTimings");

// providers/animesub/stream.ts
var DEFAULT_TOKEN = "u_mFxNX2Pva_iYMF-kz9CsNA";
var DEFAULT_INSTANCE_URL = "https://animesub.duckdns.org";
var ALL_TORRENT_SOURCES = [
  "nyaa",
  "animetosho",
  "tokyoTosho",
  "eraiRaws",
  "seadex",
  "nekobt",
  "animegarden",
  "tsukihimeDirect",
  "mikan",
  "dmhy",
  "subsplease",
  "anibt",
  "acgrip",
  "knaben",
  "piratebay",
  "torrentgalaxy",
  "torlock",
  "zilean",
  "comet",
  "stremthruTorz"
];
var languageCodes = [
  ["MULTI", "MULTI"],
  ["DUAL", "DUAL"],
  ["JAPANESE", "JP"],
  ["ENGLISH", "EN"],
  ["HINDI", "HI"],
  ["TAMIL", "TA"],
  ["TELUGU", "TE"],
  ["SPANISH", "ES"],
  ["FRENCH", "FR"],
  ["GERMAN", "DE"],
  ["ITALIAN", "IT"],
  ["KOREAN", "KO"],
  ["CHINESE", "ZH"],
  ["PORTUGUESE", "PT"],
  ["RUSSIAN", "RU"]
];
function getLanguageCodes(title) {
  const flagCodes = (title.match(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g) || []).map(
    (flag) => [...flag].map(
      (character) => String.fromCharCode(65 + character.codePointAt(0) - 127462)
    ).join("")
  );
  if (flagCodes.length > 0) {
    const unique = [...new Set(flagCodes)];
    if (unique.length > 2) return "MULTI";
    return unique.join(", ");
  }
  const uppercaseTitle = title.toUpperCase();
  const matches = languageCodes.filter(([language]) => uppercaseTitle.includes(language)).map(([, code]) => code);
  return matches.length > 0 ? [...new Set(matches)].join(", ") : "JA/EN";
}
__name(getLanguageCodes, "getLanguageCodes");
function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return "";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}
__name(formatBytes, "formatBytes");
function extractQuality(text) {
  const lower = text.toLowerCase();
  if (lower.includes("2160") || lower.includes("4k")) return "2160";
  if (lower.includes("1080")) return "1080";
  if (lower.includes("720")) return "720";
  if (lower.includes("480")) return "480";
  if (lower.includes("360")) return "360";
  return void 0;
}
__name(extractQuality, "extractQuality");
function extractFormatTags(text) {
  const tags = [];
  if (/AV1/i.test(text)) tags.push("AV1");
  else if (/x265|HEVC/i.test(text)) tags.push("HEVC");
  else if (/x264|AVC/i.test(text)) tags.push("AVC");
  if (/10-?bit|hi10p?/i.test(text)) tags.push("10-bit");
  if (/[\b\s.]DV[\b\s.]|Dolby\s*Vision/i.test(text)) tags.push("DV");
  if (/[\b\s.]HDR(?:10(?:\+)?)?[\b\s.]/i.test(text)) tags.push("HDR");
  if (/REMUX/i.test(text)) tags.push("Remux");
  if (/BluRay|BD\b|BDRip/i.test(text)) tags.push("BluRay");
  else if (/WEB-?DL|WEBRip/i.test(text)) tags.push("WEB-DL");
  if (/Dual[\s-]Audio/i.test(text)) tags.push("Dual-Audio");
  else if (/Multi[\s-]Audio/i.test(text)) tags.push("Multi-Audio");
  return tags;
}
__name(extractFormatTags, "extractFormatTags");
function extractSeeders(text, s) {
  var _a;
  if (typeof (s == null ? void 0 : s.seeders) === "number" && s.seeders >= 0) {
    return { label: `\u{1F464}${s.seeders}`, count: s.seeders };
  }
  if (typeof ((_a = s == null ? void 0 : s.behaviorHints) == null ? void 0 : _a.seeders) === "number" && s.behaviorHints.seeders >= 0) {
    return { label: `\u{1F464}${s.behaviorHints.seeders}`, count: s.behaviorHints.seeders };
  }
  const seedersMatch = text.match(/👤\s*(\d+)/) || text.match(/\bS:\s*(\d+)/i) || text.match(/(\d+)\s*(?:seeds?|seeders?)/i);
  if (seedersMatch) {
    const count = parseInt(seedersMatch[1], 10);
    return { label: `\u{1F464}${count}`, count };
  }
  return { label: "", count: 0 };
}
__name(extractSeeders, "extractSeeders");
function extractSizeBytes(text, s) {
  var _a, _b;
  const rawBytes = ((_a = s == null ? void 0 : s.behaviorHints) == null ? void 0 : _a.videoSize) || ((_b = s == null ? void 0 : s.behaviorHints) == null ? void 0 : _b.fileSize) || (s == null ? void 0 : s.size);
  if (typeof rawBytes === "number" && rawBytes > 0) {
    return { label: formatBytes(rawBytes), bytes: rawBytes };
  }
  const match = text.match(/(?:💾\s*)?([\d.]+)\s*(KB|MB|GB|TB)\b/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multiplier = unit === "TB" ? 1024 * 1024 * 1024 * 1024 : unit === "GB" ? 1024 * 1024 * 1024 : unit === "MB" ? 1024 * 1024 : 1024;
    return { label: `${match[1]} ${unit}`, bytes: val * multiplier };
  }
  return { label: "", bytes: 0 };
}
__name(extractSizeBytes, "extractSizeBytes");
function parseCustomManifest(manifestUrl) {
  const clean = manifestUrl.trim().replace(/^stremio:\/\//i, "https://");
  const match = clean.match(/^(https?:\/\/[^\/]+)\/(u_[a-zA-Z0-9_-]+)/);
  if (match) {
    return { baseUrl: match[1], token: match[2] };
  }
  return null;
}
__name(parseCustomManifest, "parseCustomManifest");
function registerDebridConfig(instanceUrl, service, apiKey, enableP2P, providerContext) {
  return __async(this, null, function* () {
    try {
      const configUrl = `${instanceUrl}/configure`;
      const getRes = yield providerContext.axios.get(configUrl, {
        timeout: 8e3
      });
      const html = getRes.data;
      const $ = providerContext.cheerio.load(html);
      const form = $("#configForm");
      const params = new URLSearchParams();
      form.find("input, select, textarea").each((_, el) => {
        const name = $(el).attr("name");
        const type = $(el).attr("type");
        const val = $(el).val() || "";
        if (!name) return;
        if (type === "checkbox") {
          if ($(el).prop("checked")) {
            params.append(name, val || "on");
          }
        } else if (type === "radio") {
          if ($(el).prop("checked")) {
            params.append(name, val);
          }
        } else {
          params.append(name, val);
        }
      });
      if (enableP2P) {
        params.set("enableP2P", "on");
        params.delete("hideUncached");
      } else {
        params.delete("enableP2P");
        params.set("hideUncached", "on");
      }
      if (service && service !== "none") {
        params.set("service[]", service);
        params.set("apiKey[]", apiKey);
      }
      for (const src of ALL_TORRENT_SOURCES) {
        if (!params.getAll("torrentSources[]").includes(src)) {
          params.append("torrentSources[]", src);
        }
      }
      const postRes = yield providerContext.axios.post(configUrl, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: configUrl
        },
        timeout: 8e3
      });
      const postHtml = typeof postRes.data === "string" ? postRes.data : JSON.stringify(postRes.data);
      const tokenMatch = postHtml.match(/\/(u_[a-zA-Z0-9_-]+)(?:\/manifest\.json|\/stream)/);
      if (tokenMatch) {
        return tokenMatch[1];
      }
    } catch (err) {
      console.warn("AnimeSub configure registration error:", err);
    }
    return null;
  });
}
__name(registerDebridConfig, "registerDebridConfig");
function resolveTokenAndBaseUrl(providerContext) {
  return __async(this, null, function* () {
    var _a;
    const kv = providerContext.kvStore;
    let customManifestUrl = "";
    let instanceUrl = DEFAULT_INSTANCE_URL;
    let debridService = "none";
    let debridApiKey = "";
    let enableP2P = true;
    if (kv) {
      customManifestUrl = (yield kv.get("animesub_manifestUrl")) || (yield kv.get("customManifestUrl")) || "";
      const inst = (yield kv.get("animesub_instanceUrl")) || (yield kv.get("customInstanceUrl"));
      if (inst == null ? void 0 : inst.trim()) instanceUrl = inst.trim().replace(/\/+$/, "");
      debridService = (yield kv.get("animesub_debridService")) || (yield kv.get("debridService")) || "none";
      debridApiKey = ((yield kv.get("animesub_debridApiKey")) || (yield kv.get("debridApiKey")) || "").trim();
      const p2pVal = (_a = yield kv.get("animesub_enableP2P")) != null ? _a : yield kv.get("enableP2P");
      if (p2pVal !== void 0) enableP2P = p2pVal;
    }
    if (customManifestUrl) {
      const parsed = parseCustomManifest(customManifestUrl);
      if (parsed) return parsed;
    }
    if (debridService !== "none" && debridApiKey) {
      const cacheKey = `animesub_token_${debridService}_${debridApiKey.slice(0, 10)}_${enableP2P}`;
      let cachedToken = yield kv == null ? void 0 : kv.get(cacheKey);
      if (!cachedToken) {
        cachedToken = (yield registerDebridConfig(
          instanceUrl,
          debridService,
          debridApiKey,
          enableP2P,
          providerContext
        )) || void 0;
        if (cachedToken && kv) {
          yield kv.set(cacheKey, cachedToken);
        }
      }
      if (cachedToken) {
        return { baseUrl: instanceUrl, token: cachedToken };
      }
    }
    return { baseUrl: instanceUrl, token: DEFAULT_TOKEN };
  });
}
__name(resolveTokenAndBaseUrl, "resolveTokenAndBaseUrl");
function fetchKitsuFallbackStreams(title, season, episode, baseUrl, token, providerContext) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d;
    try {
      const searchTerm = season && Number(season) > 1 ? `${title} Season ${season}` : title;
      const kitsuUrl = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(searchTerm)}&page[limit]=1`;
      const res = yield providerContext.axios.get(kitsuUrl, { timeout: 5e3 });
      const kitsuId = (_c = (_b = (_a = res.data) == null ? void 0 : _a.data) == null ? void 0 : _b[0]) == null ? void 0 : _c.id;
      if (!kitsuId) return [];
      const epSuffix = episode ? `:${episode}` : "";
      const streamUrl = `${baseUrl}/${token}/stream/anime/kitsu:${kitsuId}${epSuffix}.json`;
      const streamRes = yield providerContext.axios.get(streamUrl, { timeout: 1e4 });
      return Array.isArray((_d = streamRes.data) == null ? void 0 : _d.streams) ? streamRes.data.streams : [];
    } catch (e) {
      return [];
    }
  });
}
__name(fetchKitsuFallbackStreams, "fetchKitsuFallbackStreams");
var NON_UPLOADER_REGEX = /^(\d+|[a-zA-Z]{1,2}|\d{3,4}p?|4k|uhd|bluray|bd|dvd|web(-?dl|-?rip)?|h\.?26[45]|x26[45]|hevc|av1|opus|flac|aac|ac3|dts|mp3|multi(-?audio|-?sub)?|dual(-?audio)?|sub(s|bed)?|dub(bed)?|audio|remux|hdr(10\+?)?|dv|dolby|hi10p?|10bit|8bit|v\d+|repack\d*|proper|raws?|es|lat|ger|ita|fra|eng?|jap?|batch|[0-9a-f]{8}|unofficial\s*batch)$/i;
var SPEC_WORDS_REGEX = /\b(1080p?|720p?|480p?|360p?|2160p?|4k|bd|bluray|hevc|x26[45]|h\.?26[45]|av1|aac|ac3|dts|mp3|flac|opus|dual-audio|multi-audio|sub|dub|web(-?dl|-?rip)?|remux|10-?bit|hi10p?)\b/i;
function isUploaderCandidate(val) {
  if (!val || val.length <= 2) return false;
  if (NON_UPLOADER_REGEX.test(val)) return false;
  if (SPEC_WORDS_REGEX.test(val)) return false;
  return true;
}
__name(isUploaderCandidate, "isUploaderCandidate");
function extractUploader(s) {
  var _a;
  const rawSources = [
    (_a = s.behaviorHints) == null ? void 0 : _a.filename,
    s.description,
    s.title,
    s.name
  ].filter(Boolean);
  const lines = [];
  for (const raw of rawSources) {
    for (const l of String(raw).split(/\r?\n/)) {
      const trimmed = l.trim();
      if (trimmed) lines.push(trimmed);
    }
  }
  for (const line of lines) {
    const m = line.match(/^\[([a-zA-Z0-9_.\s@-]+)\]/);
    if (m) {
      const val = m[1].replace(/^@/, "").trim();
      if (isUploaderCandidate(val)) return val;
    }
  }
  for (const line of lines) {
    const gearMatch = line.match(/⚙️\s*([^\n\r]+)/);
    if (gearMatch) {
      const val = gearMatch[1].replace(/^@/, "").trim();
      if (isUploaderCandidate(val)) return val;
    }
  }
  for (const line of lines) {
    const cleanTrailing = line.replace(/(\s*\[[^\]]*\]|\s*\([^)]*\))+$/g, "").replace(/\.(mkv|mp4|avi|webm|ts)$/i, "").trim();
    const hyphenMatch = cleanTrailing.match(/[-_–]\s*@?([a-zA-Z0-9_]+(?:-[a-zA-Z0-9_]+)?)$/);
    if (hyphenMatch) {
      const val = hyphenMatch[1].trim();
      if (isUploaderCandidate(val)) return val;
    }
  }
  for (const line of lines) {
    const allBrackets = [...line.matchAll(/\[([a-zA-Z0-9_.\s@-]+)\]/g)].map(
      (m) => m[1].replace(/^@/, "").trim()
    );
    for (const b of allBrackets) {
      if (isUploaderCandidate(b)) return b;
    }
  }
  return "AnimeSub+";
}
__name(extractUploader, "extractUploader");
function parseStreamItem(s, streamSkip) {
  var _a;
  const combinedText = `${s.name || ""} ${s.description || ""} ${s.title || ""}`;
  const quality = extractQuality(combinedText);
  let link = s.url;
  if (!link && s.infoHash) {
    const trackers = (s.sources || []).filter((src) => src.startsWith("tracker:")).map((src) => `tr=${encodeURIComponent(src.replace("tracker:", ""))}`);
    const trackerQuery = trackers.length > 0 ? `&${trackers.join("&")}` : "";
    link = `magnet:?xt=urn:btih:${s.infoHash}${trackerQuery}`;
  }
  if (!link) return null;
  const { label: seedersLabel, count: seederCount } = extractSeeders(combinedText, s);
  const { label: sizeLabel, bytes: sizeBytes } = extractSizeBytes(combinedText, s);
  const formatTags = extractFormatTags(combinedText);
  const language = getLanguageCodes(combinedText);
  const debridBadge = (_a = (s.name || "").match(
    /\[(RD\+?|AD\+?|PM\+?|TB\+?|DL\+?|EN\+?|RD download|AD download)\]/i
  )) == null ? void 0 : _a[0];
  const isCachedDebrid = Boolean(debridBadge && !debridBadge.toLowerCase().includes("download")) || Boolean(link && !link.startsWith("magnet:"));
  const uploader = extractUploader(s);
  const server = debridBadge ? `${debridBadge} ${uploader}` : uploader;
  const tags = [];
  if (quality) {
    tags.push(`${quality}p`);
  }
  if (seedersLabel && !isCachedDebrid) {
    tags.push(seedersLabel);
  }
  if (debridBadge) {
    tags.push(debridBadge.replace(/[\[\]]/g, ""));
  }
  for (const tag2 of formatTags) {
    tags.push(tag2);
  }
  if (language && language !== "ENG" && language !== "JA/EN") {
    tags.push(language);
  }
  if (sizeLabel) {
    tags.push(sizeLabel);
  }
  const tag = tags.join(" \u2022 ") || void 0;
  let subtitles = void 0;
  if (Array.isArray(s.subtitles) && s.subtitles.length > 0) {
    subtitles = s.subtitles.map((sub) => {
      var _a2;
      return {
        title: sub.lang || sub.id || "Subtitle",
        language: sub.lang || "en",
        type: ((_a2 = sub.url) == null ? void 0 : _a2.endsWith(".vtt")) ? "text/vtt" : "application/x-subrip",
        uri: sub.url
      };
    });
  }
  return {
    stream: {
      server,
      link,
      type: link.startsWith("magnet:") ? "torrent" : "mp4",
      quality,
      tags: tags.length > 0 ? tags : void 0,
      tag,
      subtitles,
      skip: streamSkip
    },
    seederCount,
    sizeBytes
  };
}
__name(parseStreamItem, "parseStreamItem");
function isQualityAllowed(q, qualityFilter) {
  if (!q || qualityFilter === "all" || !qualityFilter) return true;
  if (qualityFilter === "720") return q === "720" || q === "480" || q === "360";
  if (qualityFilter === "1080") return q === "1080" || q === "720" || q === "480" || q === "360";
  if (qualityFilter === "480") return q === "480" || q === "360";
  return true;
}
__name(isQualityAllowed, "isQualityAllowed");
var QUALITY_RANKS = {
  "2160": 5,
  "1080": 4,
  "720": 3,
  "480": 2,
  "360": 1
};
function sortParsedItems(items, sortBy) {
  items.sort((a, b) => {
    if (sortBy === "seeders") {
      return b.seederCount - a.seederCount;
    }
    if (sortBy === "size") {
      return b.sizeBytes - a.sizeBytes;
    }
    const qRankA = QUALITY_RANKS[a.stream.quality || ""] || 0;
    const qRankB = QUALITY_RANKS[b.stream.quality || ""] || 0;
    if (qRankA !== qRankB) {
      return qRankB - qRankA;
    }
    return b.seederCount - a.seederCount;
  });
  return items.map((item) => item.stream);
}
__name(sortParsedItems, "sortParsedItems");
var getStream = /* @__PURE__ */ __name((_0) => __async(null, [_0], function* ({
  link: id,
  type,
  providerContext
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  try {
    const payload = (() => {
      try {
        return JSON.parse(id);
      } catch (e) {
        return {
          imdbId: id.startsWith("tt") ? id : void 0,
          kitsuId: id.startsWith("kitsu:") ? id : void 0,
          malId: id.startsWith("mal:") ? id.replace("mal:", "") : void 0
        };
      }
    })();
    let kitsuId = (_a = payload.kitsuId) != null ? _a : typeof id === "string" && id.startsWith("kitsu:") ? id : "";
    let imdbId = (_b = payload.imdbId) != null ? _b : typeof id === "string" && id.startsWith("tt") ? id : "";
    const malId = (_c = payload.malId) != null ? _c : typeof id === "string" && id.startsWith("mal:") ? id.replace("mal:", "") : "";
    const title = (_d = payload.title) != null ? _d : "";
    const season = (_e = payload.season) != null ? _e : "";
    const episode = (_f = payload.episode) != null ? _f : "";
    const effectiveType = (_h = (_g = payload.type) != null ? _g : type) != null ? _h : "series";
    if (!kitsuId && malId) {
      kitsuId = (yield resolveKitsuIdFromMal(malId, providerContext)) || "";
    }
    if (!imdbId && !kitsuId && !title) {
      console.warn("AnimeSub: missing imdbId, kitsuId, and title in link payload");
      return [];
    }
    const kv = providerContext.kvStore;
    const skipTimings = (_i = yield kv == null ? void 0 : kv.get("animesub_skipTimings")) != null ? _i : yield kv == null ? void 0 : kv.get("torrentio_skipTimings");
    const skipTimingsEnabled = skipTimings != null ? skipTimings : true;
    let streamSkip = void 0;
    if (skipTimingsEnabled && effectiveType === "series" && episode) {
      const epNum = Number(episode);
      if (epNum > 0) {
        streamSkip = yield fetchAnimeSkipTimings({
          kitsuId,
          malId: malId || void 0,
          title,
          episode: epNum,
          providerContext
        });
        if ((!streamSkip || streamSkip.length === 0) && imdbId && season) {
          streamSkip = yield fetchTheIntroDbSkipTimings({
            imdbId,
            season: Number(season),
            episode: epNum,
            providerContext
          });
        }
      }
      if (!(streamSkip == null ? void 0 : streamSkip.length)) streamSkip = void 0;
    }
    const { baseUrl, token } = yield resolveTokenAndBaseUrl(providerContext);
    const qualityFilter = (yield kv == null ? void 0 : kv.get("animesub_qualityFilter")) || (yield kv == null ? void 0 : kv.get("qualityFilter")) || "all";
    const sortBy = (yield kv == null ? void 0 : kv.get("animesub_sortBy")) || (yield kv == null ? void 0 : kv.get("sortBy")) || "qualitythenseeders";
    let rawStreams = [];
    if (kitsuId) {
      let targetKitsu = kitsuId;
      if (effectiveType === "series" && !kitsuId.includes(":") && episode) {
        targetKitsu = `${kitsuId}:${episode}`;
      }
      const streamType = effectiveType === "movie" ? "movie" : "anime";
      const kitsuUrl = `${baseUrl}/${token}/stream/${streamType}/${targetKitsu}.json`;
      console.log("AnimeSub Kitsu URL:", kitsuUrl);
      try {
        const res = yield providerContext.axios.get(kitsuUrl, { timeout: 12e3 });
        if (Array.isArray((_j = res.data) == null ? void 0 : _j.streams)) {
          rawStreams = res.data.streams;
        }
      } catch (e) {
        rawStreams = [];
      }
    }
    if (rawStreams.length === 0 && imdbId && imdbId.startsWith("tt")) {
      let streamTarget = imdbId;
      if (effectiveType === "series" && season && episode) {
        streamTarget = `${imdbId}:${season}:${episode}`;
      }
      const streamType = effectiveType === "series" ? "series" : "movie";
      const imdbUrl = `${baseUrl}/${token}/stream/${streamType}/${streamTarget}.json`;
      console.log("AnimeSub IMDb URL:", imdbUrl);
      try {
        const res = yield providerContext.axios.get(imdbUrl, { timeout: 12e3 });
        if (Array.isArray((_k = res.data) == null ? void 0 : _k.streams)) {
          rawStreams = res.data.streams;
        }
      } catch (e) {
        rawStreams = [];
      }
    }
    if (rawStreams.length === 0 && title) {
      rawStreams = yield fetchKitsuFallbackStreams(
        title,
        season,
        episode,
        baseUrl,
        token,
        providerContext
      );
    }
    const parsedItems = [];
    for (const s of rawStreams) {
      const parsed = parseStreamItem(s, streamSkip);
      if (parsed && isQualityAllowed(parsed.stream.quality, qualityFilter)) {
        parsedItems.push(parsed);
      }
    }
    return sortParsedItems(parsedItems, sortBy);
  } catch (err) {
    throwProviderError("AnimeSub", "stream", err);
  }
}), "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

