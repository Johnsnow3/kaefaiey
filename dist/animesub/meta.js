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

// providers/animesub/meta.ts
var meta_exports = {};
__export(meta_exports, {
  getMeta: () => getMeta
});


// providers/getCinemetaMeta.ts
var CINEMETA_BASE_URL = "https://v3-cinemeta.strem.io/meta";
function isCinemetaPromise(value) {
  return typeof value.then === "function";
}
__name(isCinemetaPromise, "isCinemetaPromise");
function getCache() {
  const state = typeof providerGlobal !== "undefined" && providerGlobal ? providerGlobal : globalThis;
  if (!state.__vegaCinemetaCache__ || typeof state.__vegaCinemetaCache__ !== "object") {
    state.__vegaCinemetaCache__ = /* @__PURE__ */ Object.create(null);
  }
  return state.__vegaCinemetaCache__;
}
__name(getCache, "getCache");
function resolveTmdbToImdb(tmdbId, type, providerContext) {
  return __async(this, null, function* () {
    var _a;
    try {
      const tmdbType = type === "series" ? "tv" : "movie";
      const res = yield providerContext.axios.get(
        `https://api.themoviedb.org/3/${tmdbType}/${tmdbId}/external_ids?api_key=cfe422613b250f702980a3bbf9e90716`,
        { timeout: 5e3 }
      );
      const imdb = (_a = res.data) == null ? void 0 : _a.imdb_id;
      if (typeof imdb === "string" && /^tt\d+$/.test(imdb)) {
        return imdb;
      }
    } catch (e) {
    }
    return null;
  });
}
__name(resolveTmdbToImdb, "resolveTmdbToImdb");
function getCinemetaMeta(id, type, providerContext) {
  return __async(this, null, function* () {
    var _a;
    if (!id || typeof id !== "string") {
      return null;
    }
    let cleanImdbId = (_a = id.match(/tt\d+/)) == null ? void 0 : _a[0];
    if (!cleanImdbId) {
      const tmdbMatch = id.match(/(?:themoviedb\.org\/(?:movie|tv)\/|tmdb:?)(\d+)/i) || id.match(/^(\d+)$/);
      if (tmdbMatch) {
        cleanImdbId = (yield resolveTmdbToImdb(tmdbMatch[1], type, providerContext)) || void 0;
      }
    }
    if (!cleanImdbId) {
      return null;
    }
    const cache = getCache();
    const cached = cache[cleanImdbId];
    if (cached) {
      if (isCinemetaPromise(cached)) {
        return cached;
      }
      if (cached.name && cached.imdb_id === cleanImdbId) {
        return cached;
      }
      delete cache[cleanImdbId];
    }
    const mediaType = type === "series" ? "series" : "movie";
    const url = `${CINEMETA_BASE_URL}/${mediaType}/${cleanImdbId}.json`;
    const request = providerContext.axios.get(url, { timeout: 8e3 }).then((response) => {
      var _a2;
      const meta = (_a2 = response.data) == null ? void 0 : _a2.meta;
      if (!(meta == null ? void 0 : meta.name) || meta.imdb_id !== cleanImdbId) {
        delete cache[cleanImdbId];
        return null;
      }
      cache[cleanImdbId] = meta;
      return meta;
    }).catch(() => {
      delete cache[cleanImdbId];
      return null;
    });
    cache[cleanImdbId] = request;
    return request;
  });
}
__name(getCinemetaMeta, "getCinemetaMeta");
function applyCinemetaMeta(info, meta) {
  var _a;
  if (!meta) return info;
  return __spreadProps(__spreadValues({}, info), {
    title: meta.name || info.title,
    image: meta.background || meta.poster || info.image,
    poster: meta.poster || info.poster,
    logo: meta.logo || void 0,
    synopsis: meta.description || info.synopsis,
    imdbId: meta.imdb_id || info.imdbId || "",
    tmdbId: ((_a = meta.moviedb_id) == null ? void 0 : _a.toString()) || info.tmdbId || void 0,
    type: meta.type || info.type,
    tags: meta.genres || meta.genre || void 0,
    cast: meta.cast || void 0,
    rating: meta.imdbRating || void 0
  });
}
__name(applyCinemetaMeta, "applyCinemetaMeta");
function formatEpisodeTitle(episode, name) {
  const epNum = Number(episode);
  if (!name || !name.trim()) {
    return `Episode ${episode}`;
  }
  let cleanName = name.trim();
  cleanName = cleanName.replace(/^(?:s\d+\s*e\d+|\d+x\d+)\s*[:.-]\s*/i, "");
  cleanName = cleanName.replace(
    new RegExp(`^episodes?\\s*0*${epNum}\\s*[:.-]\\s*`, "i"),
    ""
  );
  if (new RegExp(`^0*${epNum}\\s*\\.\\s*`, "i").test(cleanName)) {
    return cleanName;
  }
  if (new RegExp(`^0*${epNum}\\s*[:.-]\\s*`, "i").test(cleanName)) {
    return `${epNum}. ${cleanName.replace(new RegExp(`^0*${epNum}\\s*[:.-]\\s*`, "i"), "")}`;
  }
  if (new RegExp(`^episodes?\\s*0*${epNum}$`, "i").test(cleanName)) {
    return `Episode ${epNum}`;
  }
  return `${epNum}. ${cleanName}`;
}
__name(formatEpisodeTitle, "formatEpisodeTitle");
function getEpisodeNumber(title, season) {
  if (/\b(?:e\d+|episodes?\s*:?\s*\d+)\s*(?:[-–,&/]|\band\b)\s*(?:e|episodes?\s*:?\s*)?\d+/i.test(
    title
  )) {
    return void 0;
  }
  const explicitSeasons = [
    ...title.matchAll(/\bseason\s*:?\s*(\d{1,2})\b/gi),
    ...title.matchAll(/\bs(\d{1,2})\s*e\d{1,3}\b/gi)
  ].map((match) => Number(match[1]));
  if (explicitSeasons.some((value) => value !== season)) return void 0;
  const matches = [
    ...title.matchAll(/\bs\d{1,2}\s*e(\d{1,3})\b/gi),
    ...title.matchAll(/\bepisodes?\s*:?\s*(\d{1,3})\b/gi),
    ...title.matchAll(/\bep\s*\.?:?\s*(\d{1,3})\b/gi),
    ...title.matchAll(/\be(\d{1,3})\b/gi),
    ...title.matchAll(/^\s*(\d{1,3})\s*[.:-]\s*/gi)
  ].map((match) => Number(match[1]));
  const episodes = [...new Set(matches.filter((episode) => episode > 0))];
  return episodes.length === 1 ? episodes[0] : void 0;
}
__name(getEpisodeNumber, "getEpisodeNumber");
function enrichCinemetaEpisodes(episodes, videos, season) {
  var _a;
  if (!videos || !Array.isArray(videos) || videos.length === 0 || !season) {
    return episodes;
  }
  const videosByEpisode = /* @__PURE__ */ new Map();
  let hasDuplicateVideo = false;
  for (const video of videos) {
    const episode = (_a = video.episode) != null ? _a : video.number;
    if (video.season !== season || !episode) continue;
    if (videosByEpisode.has(episode)) {
      hasDuplicateVideo = true;
      continue;
    }
    videosByEpisode.set(episode, video);
  }
  const matched = episodes.map((episode) => {
    const episodeNumber = getEpisodeNumber(episode.title, season);
    const video = episodeNumber ? videosByEpisode.get(episodeNumber) : void 0;
    const description = (video == null ? void 0 : video.description) || (video == null ? void 0 : video.overview);
    return { episode, episodeNumber, video, description };
  });
  const numbers = matched.map(({ episodeNumber }) => episodeNumber);
  const allMatched = episodes.length > 0 && !hasDuplicateVideo && matched.every(({ video }) => Boolean(video)) && new Set(numbers).size === numbers.length;
  if (!allMatched) return episodes;
  return matched.map(({ episode, video, description }) => __spreadProps(__spreadValues({}, episode), {
    description: description || episode.description,
    image: (video == null ? void 0 : video.thumbnail) || episode.image
  }));
}
__name(enrichCinemetaEpisodes, "enrichCinemetaEpisodes");

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
function enrichAnimeEpisodesWithSkipTimings(episodes, options) {
  return __async(this, null, function* () {
    const { kitsuId, title, imdbId, season, providerContext, signal } = options;
    let malId = null;
    if (kitsuId) {
      malId = yield resolveMalIdFromKitsu(kitsuId, providerContext);
    }
    if (!malId && title) {
      malId = yield resolveMalIdFromTitle(title, providerContext);
    }
    const promises = episodes.map((ep) => __async(null, null, function* () {
      let epNum;
      try {
        const parsed = JSON.parse(ep.link);
        epNum = Number(parsed.episode);
      } catch (e) {
        epNum = season ? getEpisodeNumber(ep.title, season) : void 0;
      }
      if (!epNum || epNum < 1) {
        return ep;
      }
      let skipTimings = [];
      if (malId) {
        skipTimings = yield fetchAniSkipTimings(malId, epNum, providerContext, signal);
      }
      if ((!skipTimings || skipTimings.length === 0) && imdbId && season) {
        skipTimings = yield fetchTheIntroDbSkipTimings({
          imdbId,
          season,
          episode: epNum,
          providerContext,
          signal
        });
      }
      if (skipTimings && skipTimings.length > 0) {
        return __spreadProps(__spreadValues({}, ep), {
          skip: skipTimings
        });
      }
      return ep;
    }));
    return Promise.all(promises);
  });
}
__name(enrichAnimeEpisodesWithSkipTimings, "enrichAnimeEpisodesWithSkipTimings");

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

// providers/animesub/meta.ts
function createCinemetaPayload(imdbId, type, meta, video) {
  var _a, _b, _c, _d, _e;
  const videoParts = ((_a = video == null ? void 0 : video.id) == null ? void 0 : _a.split(":")) || [];
  return JSON.stringify({
    title: meta.name || "",
    imdbId,
    season: ((_b = video == null ? void 0 : video.season) == null ? void 0 : _b.toString()) || videoParts[1] || "",
    episode: ((_d = (_c = video == null ? void 0 : video.episode) != null ? _c : video == null ? void 0 : video.number) == null ? void 0 : _d.toString()) || videoParts[2] || "",
    type,
    tmdbId: ((_e = meta.moviedb_id) == null ? void 0 : _e.toString()) || "",
    year: meta.year
  });
}
__name(createCinemetaPayload, "createCinemetaPayload");
function getCinemetaInfo(link, providerContext) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e;
    const imdbId = ((_a = link.match(/tt\d+/)) == null ? void 0 : _a[0]) || "";
    const type = /\bseries\b/i.test(link) ? "series" : "movie";
    if (!imdbId) throw new Error(`Missing IMDb ID in link: ${link}`);
    const meta = yield getCinemetaMeta(imdbId, type, providerContext);
    if (!meta) {
      return {
        title: imdbId,
        synopsis: "",
        image: "",
        imdbId,
        type,
        linkList: []
      };
    }
    const linkList = [];
    if (type === "series") {
      const seasons = /* @__PURE__ */ new Map();
      const now = Date.now();
      for (const video of meta.videos || []) {
        const episode = (_b = video.episode) != null ? _b : video.number;
        if (!video.season || video.season <= 0 || !episode) continue;
        const releaseStr = video.released || video.firstAired;
        if (releaseStr) {
          const releaseTime = new Date(releaseStr).getTime();
          if (!isNaN(releaseTime) && releaseTime > now) {
            continue;
          }
        }
        const episodes = seasons.get(video.season) || [];
        episodes.push({
          title: formatEpisodeTitle(episode, video.name),
          link: createCinemetaPayload(imdbId, "series", meta, video)
        });
        seasons.set(video.season, episodes);
      }
      const skipTimings = (_e = yield (_c = providerContext.kvStore) == null ? void 0 : _c.get("animesub_skipTimings")) != null ? _e : yield (_d = providerContext.kvStore) == null ? void 0 : _d.get("torrentio_skipTimings");
      for (const season of [...seasons.keys()].sort((a, b) => a - b)) {
        const seasonEpisodes = seasons.get(season) || [];
        if (seasonEpisodes.length === 0) continue;
        let directLinks = enrichCinemetaEpisodes(
          seasonEpisodes,
          meta.videos || [],
          season
        );
        if (skipTimings != null ? skipTimings : true) {
          directLinks = yield enrichAnimeEpisodesWithSkipTimings(
            directLinks,
            {
              title: meta.name,
              imdbId,
              season,
              providerContext
            }
          );
        }
        linkList.push({
          title: `Season ${season}`,
          directLinks
        });
      }
    } else {
      linkList.push({
        title: meta.name || "Movie",
        directLinks: [
          {
            title: "Movie",
            type: "movie",
            link: createCinemetaPayload(imdbId, "movie", meta)
          }
        ]
      });
    }
    return applyCinemetaMeta(
      {
        title: meta.name || "",
        synopsis: meta.description || "",
        image: meta.background || meta.poster || "",
        poster: meta.poster || "",
        imdbId: imdbId || meta.imdb_id || "",
        type,
        linkList
      },
      meta
    );
  });
}
__name(getCinemetaInfo, "getCinemetaInfo");
function getKitsuInfo(kitsuId, providerContext) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const url = `https://anime-kitsu.strem.fun/meta/anime/${kitsuId}.json`;
    const res = yield providerContext.axios.get(url, {
      headers: providerContext.commonHeaders,
      timeout: 1e4
    });
    const meta = (_a = res.data) == null ? void 0 : _a.meta;
    if (!meta) {
      throw new Error(`Failed to load Kitsu meta for ${kitsuId}`);
    }
    const isMovie = meta.type === "movie" || meta.animeType === "movie" || (!meta.videos || meta.videos.length <= 1 && meta.runtime && !((_b = meta.videos[0]) == null ? void 0 : _b.episode));
    const linkList = [];
    const skipTimings = (_e = yield (_c = providerContext.kvStore) == null ? void 0 : _c.get("animesub_skipTimings")) != null ? _e : yield (_d = providerContext.kvStore) == null ? void 0 : _d.get("torrentio_skipTimings");
    if (isMovie) {
      const video = (_f = meta.videos) == null ? void 0 : _f[0];
      const imdbId = (video == null ? void 0 : video.imdb_id) || meta.imdb_id || "";
      linkList.push({
        title: meta.name || "Movie",
        directLinks: [
          {
            title: "Movie",
            type: "movie",
            link: JSON.stringify({
              title: meta.name,
              kitsuId: (video == null ? void 0 : video.id) || meta.id,
              imdbId,
              type: "movie"
            })
          }
        ]
      });
    } else {
      const seasons = /* @__PURE__ */ new Map();
      const now = Date.now();
      for (const video of meta.videos || []) {
        const season = video.season || 1;
        const episode = (_h = (_g = video.episode) != null ? _g : video.number) != null ? _h : 1;
        const releaseStr = video.released;
        if (releaseStr) {
          const releaseTime = new Date(releaseStr).getTime();
          if (!isNaN(releaseTime) && releaseTime > now) {
            continue;
          }
        }
        const epTitle = video.title ? formatEpisodeTitle(episode, video.title) : `Episode ${episode}`;
        const imdbId = video.imdb_id || meta.imdb_id || "";
        const episodes = seasons.get(season) || [];
        episodes.push({
          title: epTitle,
          link: JSON.stringify({
            title: meta.name,
            kitsuId: video.id || `${meta.id}:${episode}`,
            imdbId,
            season: String(season),
            episode: String(episode),
            type: "series"
          }),
          description: video.overview,
          image: video.thumbnail
        });
        seasons.set(season, episodes);
      }
      for (const season of [...seasons.keys()].sort((a, b) => a - b)) {
        let directLinks = seasons.get(season) || [];
        if (directLinks.length === 0) continue;
        const firstWithImdb = directLinks.find((d) => {
          try {
            return Boolean(JSON.parse(d.link).imdbId);
          } catch (e) {
            return false;
          }
        });
        const seasonImdb = firstWithImdb ? JSON.parse(firstWithImdb.link).imdbId : meta.imdb_id;
        if (skipTimings != null ? skipTimings : true) {
          directLinks = yield enrichAnimeEpisodesWithSkipTimings(
            directLinks,
            {
              kitsuId,
              title: meta.name,
              imdbId: seasonImdb,
              season,
              providerContext
            }
          );
        }
        linkList.push({
          title: `Season ${season}`,
          directLinks
        });
      }
    }
    return {
      title: meta.name || "",
      synopsis: meta.description || "",
      image: meta.background || meta.poster || "",
      poster: meta.poster || "",
      logo: meta.logo || void 0,
      imdbId: meta.imdb_id || "",
      type: isMovie ? "movie" : "series",
      tags: meta.genres,
      rating: meta.imdbRating || meta.kitsuRating,
      linkList
    };
  });
}
__name(getKitsuInfo, "getKitsuInfo");
function getMalInfo(malId, title, providerContext) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f;
    let kitsuId = yield resolveKitsuIdFromMal(malId, providerContext);
    if (!kitsuId && title) {
      try {
        const searchRes = yield providerContext.axios.get(
          `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=1`,
          { headers: { Accept: "application/vnd.api+json" }, timeout: 6e3 }
        );
        kitsuId = ((_c = (_b = (_a = searchRes.data) == null ? void 0 : _a.data) == null ? void 0 : _b[0]) == null ? void 0 : _c.id) || null;
      } catch (e) {
      }
    }
    if (kitsuId) {
      const kitsuMeta = yield getKitsuInfo(`kitsu:${kitsuId}`, providerContext);
      if (kitsuMeta.linkList) {
        for (const group of kitsuMeta.linkList) {
          if (group.directLinks) {
            for (const ep of group.directLinks) {
              try {
                const p = JSON.parse(ep.link);
                p.malId = malId;
                ep.link = JSON.stringify(p);
              } catch (e) {
              }
            }
          }
        }
      }
      return kitsuMeta;
    }
    if (title) {
      try {
        const cinemetaSearch = `https://v3-cinemeta.strem.io/catalog/series/top/search=${encodeURIComponent(title)}.json`;
        const cRes = yield providerContext.axios.get(cinemetaSearch, { timeout: 6e3 });
        const imdbId = (_f = (_e = (_d = cRes.data) == null ? void 0 : _d.metas) == null ? void 0 : _e[0]) == null ? void 0 : _f.imdb_id;
        if (imdbId) {
          return yield getCinemetaInfo(imdbId, providerContext);
        }
      } catch (e) {
      }
    }
    throw new Error(`Failed to resolve metadata for MAL ID ${malId}`);
  });
}
__name(getMalInfo, "getMalInfo");
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    try {
      let malId;
      let title;
      try {
        const parsed = JSON.parse(link);
        if (parsed.malId) malId = String(parsed.malId);
        if (parsed.title) title = parsed.title;
      } catch (e) {
        const malMatch = link.match(/mal:(\d+)/) || link.match(/myanimelist\.net\/anime\/(\d+)/);
        if (malMatch) malId = malMatch[1];
      }
      if (malId) {
        return yield getMalInfo(malId, title, providerContext);
      }
      const kitsuMatch = link.match(/kitsu:(\d+)/);
      if (kitsuMatch) {
        return yield getKitsuInfo(kitsuMatch[0], providerContext);
      }
      return yield getCinemetaInfo(link, providerContext);
    } catch (err) {
      throwProviderError("AnimeSub", "metadata", err);
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

