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

// providers/torrentio/stream.ts
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

// providers/torrentio/stream.ts
var languageCodes = [
  ["MULTI", "MULTI"],
  ["DUAL", "DUAL"],
  ["HINDI", "HI"],
  ["TAMIL", "TA"],
  ["TELUGU", "Tz"],
  ["SPANISH", "SP"],
  ["FRENCH", "FR"],
  ["GERMAN", "DE"],
  ["ITALIAN", "IT"],
  ["KOREAN", "KO"],
  ["JAPANESE", "JP"],
  ["ENGLISH", "EN"]
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
  return matches.length > 0 ? [...new Set(matches)].join(", ") : "ENG";
}
__name(getLanguageCodes, "getLanguageCodes");
var NON_UPLOADER_REGEX = /^(\d+|[a-zA-Z]{1,2}|\d{3,4}p?|4k|uhd|bluray|bd|dvd|web(-?dl|-?rip)?|h\.?26[45]|x26[45]|hevc|av1|opus|flac|aac|ac3|dts|mp3|multi(-?audio|-?sub)?|dual(-?audio)?|sub(s|bed)?|dub(bed)?|audio|remux|hdr(10\+?)?|dv|dolby|hi10p?|10bit|8bit|v\d+|repack\d*|proper|raws?|es|lat|ger|ita|fra|eng?|jap?|batch|[0-9a-f]{8})$/i;
var SPEC_WORDS_REGEX = /\b(1080p?|720p?|480p?|360p?|2160p?|4k|bd|bluray|hevc|x26[45]|h\.?26[45]|av1|aac|ac3|dts|mp3|flac|opus|dual-audio|multi-audio|sub|dub|web(-?dl|-?rip)?|remux|10-?bit|hi10p?)\b/i;
function isUploaderCandidate(val) {
  if (!val || val.length <= 2) return false;
  if (NON_UPLOADER_REGEX.test(val)) return false;
  if (SPEC_WORDS_REGEX.test(val)) return false;
  return true;
}
__name(isUploaderCandidate, "isUploaderCandidate");
function extractTorrentioUploader(title, name) {
  const combined = `${name || ""}
${title || ""}`;
  const lines = combined.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const allBrackets = [...line.matchAll(/\[([a-zA-Z0-9_.\s@-]+)\]/g)].map(
      (m) => m[1].replace(/^@/, "").trim()
    );
    for (const b of allBrackets) {
      if (isUploaderCandidate(b)) return b;
    }
  }
  for (const line of lines) {
    const cleanTrailing = line.replace(/(\s*\[[^\]]*\]|\s*\([^)]*\))+$/g, "").replace(/\.(mkv|mp4|avi|webm|ts)$/i, "").trim();
    const hyphenMatch = cleanTrailing.match(/[-_–]\s*@?([a-zA-Z0-9_]+(?:-[a-zA-Z0-9_]+)?)$/);
    if (hyphenMatch && isUploaderCandidate(hyphenMatch[1].trim())) {
      return hyphenMatch[1].trim();
    }
  }
  for (const line of lines) {
    const gearMatch = line.match(/⚙️\s*([^\n\r]+)/);
    if (gearMatch) {
      const val = gearMatch[1].replace(/^@/, "").trim();
      if (isUploaderCandidate(val)) return val;
    }
  }
  return "Torrentio";
}
__name(extractTorrentioUploader, "extractTorrentioUploader");
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
var getStream = /* @__PURE__ */ __name((_0) => __async(null, [_0], function* ({
  link: id,
  type,
  providerContext
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  try {
    const payload = (() => {
      try {
        return JSON.parse(id);
      } catch (e) {
        return { imdbId: id };
      }
    })();
    let imdbId = (_b = (_a = payload.imdbId) != null ? _a : id) != null ? _b : "";
    const season = (_c = payload.season) != null ? _c : "";
    const episode = (_d = payload.episode) != null ? _d : "";
    const effectiveType = (_f = (_e = payload.type) != null ? _e : type) != null ? _f : "movie";
    if (!imdbId || imdbId === "undefined" || imdbId === "[object Object]") {
      if (id && id.startsWith("tt")) {
        imdbId = id;
      }
    }
    if (!imdbId || !imdbId.startsWith("tt")) {
      console.warn("torrentio: missing or invalid imdbId in link payload");
      return [];
    }
    const skipTimings = yield (_g = providerContext.kvStore) == null ? void 0 : _g.get("torrentio_skipTimings");
    const skipTimingsEnabled = skipTimings != null ? skipTimings : true;
    let streamSkip = void 0;
    if (skipTimingsEnabled && effectiveType === "series" && imdbId && season && episode) {
      streamSkip = yield fetchTheIntroDbSkipTimings({
        imdbId,
        season: Number(season),
        episode: Number(episode),
        providerContext
      });
      if (!(streamSkip == null ? void 0 : streamSkip.length)) streamSkip = void 0;
    }
    const kv = providerContext.kvStore;
    let baseUrl = "https://torrentio.strem.fun";
    let debridService = "none";
    let debridApiKey = "";
    let qualityFilter = "all";
    let sortBy = "qualitythenseeders";
    let includeP2PFallback = true;
    if (kv) {
      const customUrl = (yield kv.get("customInstanceUrl")) || (yield kv.get("torrentio_customInstanceUrl"));
      if (customUrl && customUrl.trim()) baseUrl = customUrl.trim().replace(/\/+$/, "");
      debridService = (yield kv.get("debridService")) || (yield kv.get("torrentio_debridService")) || "none";
      debridApiKey = ((yield kv.get("debridApiKey")) || (yield kv.get("torrentio_debridApiKey")) || "").trim();
      qualityFilter = (yield kv.get("qualityFilter")) || (yield kv.get("torrentio_qualityFilter")) || "all";
      sortBy = (yield kv.get("sortBy")) || (yield kv.get("torrentio_sortBy")) || "qualitythenseeders";
      const fallbackSetting = (_h = yield kv.get("includeP2PFallback")) != null ? _h : yield kv.get("torrentio_includeP2PFallback");
      if (fallbackSetting !== void 0) includeP2PFallback = fallbackSetting;
    }
    const optionsParts = [];
    if (sortBy && sortBy !== "qualitythenseeders") {
      optionsParts.push(`sort=${sortBy}`);
    }
    if (qualityFilter && qualityFilter !== "all") {
      optionsParts.push(`qualityfilter=${qualityFilter}`);
    }
    if (debridService && debridService !== "none" && debridApiKey) {
      optionsParts.push(`${debridService}=${debridApiKey}`);
      if (!includeP2PFallback) {
        optionsParts.push("debridoptions=nodownloadlinks");
      }
    }
    const optionsSegment = optionsParts.length > 0 ? `${optionsParts.join("|")}/` : "";
    let url = `${baseUrl}/${optionsSegment}stream/${effectiveType}/${imdbId}`;
    if (effectiveType === "series" && season && episode) {
      url += `:${season}:${episode}`;
    }
    url += `.json`;
    console.log("Torrentio URL:", url);
    const res = yield providerContext.axios.get(url, {
      timeout: 1e4
    });
    const streams = [];
    if (res.data && res.data.streams) {
      res.data.streams.forEach((s) => {
        var _a2, _b2;
        let quality = void 0;
        const lowerName = (s.name || "").toLowerCase() + " " + (s.title || "").toLowerCase();
        if (lowerName.includes("2160") || lowerName.includes("4k"))
          quality = "2160";
        else if (lowerName.includes("1080")) quality = "1080";
        else if (lowerName.includes("720")) quality = "720";
        else if (lowerName.includes("480")) quality = "480";
        else if (lowerName.includes("360")) quality = "360";
        let link = s.url;
        if (!link && s.infoHash) {
          link = `magnet:?xt=urn:btih:${s.infoHash}`;
        }
        const title = s.title || "";
        const combinedText = `${s.name || ""} ${title}`;
        const language = getLanguageCodes(title);
        const size = ((_a2 = title.match(/💾\s*([\d.]+\s*(?:KB|MB|GB|TB))/i)) == null ? void 0 : _a2[1]) || "";
        const uploader = extractTorrentioUploader(title, s.name);
        let seeders = "";
        const seedersMatch = title.match(/👤\s*(\d+)/);
        if (seedersMatch) {
          seeders = `\u{1F464}${seedersMatch[1]}`;
        } else {
          const slMatch = title.match(/S:\s*(\d+)/i);
          if (slMatch) {
            seeders = `\u{1F464}${slMatch[1]}`;
          }
        }
        const formatTags = extractFormatTags(combinedText);
        const debridBadge = (_b2 = (s.name || "").match(
          /\[(RD\+?|AD\+?|PM\+?|TB\+?|DL\+?|OC\+?|RD download|AD download)\]/i
        )) == null ? void 0 : _b2[0];
        const isCachedDebrid = Boolean(debridBadge && !debridBadge.toLowerCase().includes("download")) || Boolean(link && !link.startsWith("magnet:"));
        const server = debridBadge ? `${debridBadge} ${uploader}` : uploader;
        const tags = [];
        if (quality) {
          tags.push(`${quality}p`);
        }
        if (seeders && !isCachedDebrid) {
          tags.push(seeders);
        }
        if (debridBadge) {
          tags.push(debridBadge.replace(/[\[\]]/g, ""));
        }
        for (const tag2 of formatTags) {
          tags.push(tag2);
        }
        if (language && language !== "ENG") {
          tags.push(language);
        }
        if (size) {
          tags.push(size);
        }
        const tag = tags.join(" \u2022 ") || void 0;
        if (link) {
          streams.push({
            server,
            link,
            type: link.startsWith("magnet:") ? "torrent" : "mp4",
            quality,
            tags: tags.length > 0 ? tags : void 0,
            tag,
            skip: streamSkip
          });
        }
      });
    }
    const isQualityAllowed = /* @__PURE__ */ __name((q) => {
      if (!q) return true;
      if (qualityFilter === "all" || !qualityFilter) return true;
      if (qualityFilter === "720" || qualityFilter === "720p,480p") {
        return q === "720" || q === "480" || q === "360";
      }
      if (qualityFilter === "1080" || qualityFilter === "1080p,720p,480p") {
        return q === "1080" || q === "720" || q === "480" || q === "360";
      }
      if (qualityFilter === "480") {
        return q === "480" || q === "360";
      }
      return true;
    }, "isQualityAllowed");
    const filteredStreams = streams.filter((s) => isQualityAllowed(s.quality));
    console.log(`Torrentio streams (${filteredStreams.length}/${streams.length} allowed for quality=${qualityFilter}):`, filteredStreams);
    return filteredStreams;
  } catch (err) {
    throwProviderError("Torrentio", "stream", err);
  }
}), "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

