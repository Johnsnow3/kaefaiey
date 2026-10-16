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

// providers/hdhub4u/meta.ts
var meta_exports = {};
__export(meta_exports, {
  getMeta: () => getMeta
});


// providers/getBaseUrl.ts
var urlsEndpoint = "https://raw.githubusercontent.com/Zenda-Cross/vega-providers/refs/heads/main/urls.json";
var cacheTtl = 60 * 60 * 1e3;
function getCache() {
  var _a;
  const state = typeof providerGlobal !== "undefined" && providerGlobal ? providerGlobal : globalThis;
  (_a = state.__vegaProviderBaseUrlCache__) != null ? _a : state.__vegaProviderBaseUrlCache__ = { expiresAt: 0 };
  return state.__vegaProviderBaseUrlCache__;
}
__name(getCache, "getCache");
function fetchProviderUrls() {
  return __async(this, null, function* () {
    const cache = getCache();
    if (cache.data && Date.now() < cache.expiresAt) {
      return cache.data;
    }
    if (cache.request) {
      return cache.request;
    }
    const request = fetch(urlsEndpoint).then((response) => __async(null, null, function* () {
      if (!response.ok) {
        throw new Error(`URL configuration request failed: ${response.status}`);
      }
      const data = yield response.json();
      console.log("Fetched provider URL configuration");
      cache.data = data;
      cache.expiresAt = Date.now() + cacheTtl;
      return data;
    })).catch((error) => {
      if (cache.data) {
        console.warn("Using stale provider URL configuration", error);
        return cache.data;
      }
      throw error;
    }).finally(() => {
      cache.request = void 0;
    });
    Object.defineProperty(cache, "request", {
      configurable: true,
      enumerable: false,
      value: request,
      writable: true
    });
    return request;
  });
}
__name(fetchProviderUrls, "fetchProviderUrls");
var getBaseUrl = /* @__PURE__ */ __name((providerValue) => __async(null, null, function* () {
  var _a, _b;
  try {
    const providerUrls = yield fetchProviderUrls();
    return (_b = (_a = providerUrls[providerValue]) == null ? void 0 : _a.url) != null ? _b : "";
  } catch (error) {
    console.error(`Error fetching baseUrl: ${providerValue}`, error);
    throw error;
  }
}), "getBaseUrl");

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

// providers/getCinemetaMeta.ts
var CINEMETA_BASE_URL = "https://v3-cinemeta.strem.io/meta";
function isCinemetaPromise(value) {
  return typeof value.then === "function";
}
__name(isCinemetaPromise, "isCinemetaPromise");
function getCache2() {
  const state = typeof providerGlobal !== "undefined" && providerGlobal ? providerGlobal : globalThis;
  if (!state.__vegaCinemetaCache__ || typeof state.__vegaCinemetaCache__ !== "object") {
    state.__vegaCinemetaCache__ = /* @__PURE__ */ Object.create(null);
  }
  return state.__vegaCinemetaCache__;
}
__name(getCache2, "getCache");
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
    const cache = getCache2();
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
function getCinemetaSeason(value) {
  if (/\bseason\s*:?\s*\d{1,2}\s*[-–&/]\s*(?:season\s*:?\s*)?\d{1,2}\b/i.test(
    value
  )) {
    return void 0;
  }
  const matches = [
    ...value.matchAll(/\bseason\s*:?\s*(\d{1,2})\b/gi),
    ...value.matchAll(/\bs(\d{1,2})(?=\s*e\d|\b)/gi)
  ].map((match) => Number(match[1]));
  const seasons = [...new Set(matches.filter((season) => season > 0))];
  return seasons.length === 1 ? seasons[0] : void 0;
}
__name(getCinemetaSeason, "getCinemetaSeason");
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
function enrichEpisodesWithSkipTimings(episodes, imdbId, season, providerContext, signal) {
  return __async(this, null, function* () {
    if (!imdbId || !season || season < 1 || !/^tt\d+$/.test(imdbId)) {
      return episodes;
    }
    const promises = episodes.map((ep) => __async(null, null, function* () {
      const episodeNum = getEpisodeNumber(ep.title, season);
      if (!episodeNum || episodeNum < 1) {
        return ep;
      }
      const skipTimings = yield fetchTheIntroDbSkipTimings({
        imdbId,
        season,
        episode: episodeNum,
        providerContext,
        signal
      });
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
__name(enrichEpisodesWithSkipTimings, "enrichEpisodesWithSkipTimings");

// providers/hdhub4u/meta.ts
var hdbHeaders = {
  Cookie: "xla=s4t",
  Referer: "https://google.com",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
};
function getEpisodeLinks($, seriesTitle) {
  const qualityGroups = {};
  $("strong").each((_, element) => {
    const episodeTitle = $(element).text().trim();
    if (!/^episode\s*\d+$/i.test(episodeTitle)) return;
    const heading = $(element).closest("h1,h2,h3,h4,h5,h6,p,div");
    if (!heading.length) return;
    for (const sibling of heading.nextAll().toArray()) {
      const siblingHeading = $(sibling);
      if (/^episode\s*\d+$/i.test(siblingHeading.text().trim())) break;
      const driveLinks = siblingHeading.find('a[href*="hubdrive"],a:contains("Drive")');
      driveLinks.each((_2, aEl) => {
        const driveLink = $(aEl).attr("href");
        if (driveLink) {
          const textContext = $(aEl).text().toLowerCase() + " " + $(aEl).parent().text().toLowerCase() + " " + $(aEl).parent().prev().text().toLowerCase();
          let quality = "Unknown";
          if (textContext.includes("2160p") || textContext.includes("4k")) quality = "4K";
          else if (textContext.includes("1080p")) quality = "1080p";
          else if (textContext.includes("720p")) quality = "720p";
          else if (textContext.includes("480p")) quality = "480p";
          const epTitle = episodeTitle.toUpperCase();
          if (!qualityGroups[quality]) {
            qualityGroups[quality] = [];
          }
          if (!qualityGroups[quality].some((ep) => ep.link === driveLink)) {
            qualityGroups[quality].push({ title: epTitle, link: driveLink });
          }
        }
      });
    }
  });
  const links = [];
  for (const [quality, episodes] of Object.entries(qualityGroups)) {
    const linkTitle = quality === "Unknown" ? seriesTitle : `${seriesTitle} - ${quality}`;
    const linkObj = {
      title: linkTitle,
      directLinks: episodes
    };
    if (quality !== "Unknown") {
      linkObj.quality = quality;
    }
    links.push(linkObj);
  }
  return links;
}
__name(getEpisodeLinks, "getEpisodeLinks");
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c;
    try {
      const { axios, cheerio } = providerContext;
      const baseUrl = yield getBaseUrl("hdhub");
      const url = new URL(link, `${baseUrl}/`).href;
      const res = yield axios.get(url, { headers: hdbHeaders });
      const data = res.data;
      const $ = cheerio.load(data);
      const container = $(".page-body");
      const imdbId = ((_a = container.find('a[href*="imdb.com/title/tt"]:not([href*="imdb.com/title/tt/"])').attr("href")) == null ? void 0 : _a.split("/")[4]) || "";
      const title = container.find(
        'h2[data-ved="2ahUKEwjL0NrBk4vnAhWlH7cAHRCeAlwQ3B0oATAfegQIFBAM"],h2[data-ved="2ahUKEwiP0pGdlermAhUFYVAKHV8tAmgQ3B0oATAZegQIDhAM"]'
      ).text();
      const type = title.toLocaleLowerCase().includes("season") ? "series" : "movie";
      const synopsis = container.find('strong:contains("DESCRIPTION")').parent().text().replace("DESCRIPTION:", "");
      const image = container.find('img[decoding="async"]').attr("src") || "";
      const links = [];
      const episodeLinks = getEpisodeLinks($, title);
      if (episodeLinks.length === 0) {
        const directLink = [];
        container.find('a:contains("EPiSODE")').map((i, element) => {
          const epTitle = $(element).text();
          const episodesLink = $(element).attr("href");
          if (episodesLink) {
            directLink.push({
              title: epTitle.toLocaleUpperCase(),
              link: episodesLink
            });
          }
        });
        if (directLink.length > 0) {
          links.push({
            title,
            directLinks: directLink
          });
        }
      } else {
        links.push(...episodeLinks);
      }
      if (links.length === 0) {
        container.find(
          'a:contains("480"),a:contains("720"),a:contains("1080"),a:contains("2160"),a:contains("4K")'
        ).map((i, element) => {
          var _a2;
          const quality = ((_a2 = $(element).text().match(/\b(480p|720p|1080p|2160p)\b/i)) == null ? void 0 : _a2[0]) || "";
          const movieLinks = $(element).attr("href");
          const title2 = $(element).text();
          if (movieLinks) {
            links.push({
              directLinks: [
                { link: movieLinks, title: "Movie", type: "movie" }
              ],
              quality,
              title: title2
            });
          }
        });
      }
      const quickDownload = yield (_b = providerContext.kvStore) == null ? void 0 : _b.get("hdhub4u_quickDownload");
      const websiteInfo = {
        title,
        synopsis,
        image,
        imdbId: imdbId || "",
        type,
        quickDownload: quickDownload != null ? quickDownload : true,
        linkList: links,
        webUrl: url
      };
      if (!imdbId) return websiteInfo;
      try {
        const cinemeta = yield getCinemetaMeta(imdbId, type, providerContext);
        if (cinemeta) {
          if (type === "series" && cinemeta.type === "series") {
            const skipTimings = yield (_c = providerContext.kvStore) == null ? void 0 : _c.get("hdhub4u_skipTimings");
            websiteInfo.linkList = yield Promise.all(
              websiteInfo.linkList.map((item) => __async(null, null, function* () {
                if (!item.directLinks) return item;
                const season = getCinemetaSeason(item.title) || getCinemetaSeason(title);
                if (!season) return item;
                let enriched = enrichCinemetaEpisodes(
                  item.directLinks,
                  cinemeta.videos || [],
                  season
                );
                if (skipTimings != null ? skipTimings : true) {
                  try {
                    enriched = yield enrichEpisodesWithSkipTimings(
                      enriched,
                      imdbId,
                      season,
                      providerContext
                    );
                  } catch (e) {
                    console.warn("HDHub4u: Skip timings failed", e);
                  }
                }
                return __spreadProps(__spreadValues({}, item), {
                  directLinks: enriched
                });
              }))
            );
          }
          return applyCinemetaMeta(websiteInfo, cinemeta);
        }
      } catch (e) {
        console.warn("HDHub4u: Cinemeta lookup failed", e);
      }
      return websiteInfo;
    } catch (err) {
      throwProviderError("HDHub4u", "metadata", err);
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

