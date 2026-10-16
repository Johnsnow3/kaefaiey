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

// providers/katmovies/meta.ts
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
var CONTEXT_KEY = "cinemetaMeta";
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
function addCinemetaContext(url, imdbId, season) {
  const parsedUrl = new URL(url);
  parsedUrl.hash = `${CONTEXT_KEY}=${encodeURIComponent(
    JSON.stringify({ imdbId, season })
  )}`;
  return parsedUrl.href;
}
__name(addCinemetaContext, "addCinemetaContext");
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

// providers/katmovies/meta.ts
function getWithWAF(url, axios, openWebView, headers) {
  return __async(this, null, function* () {
    var _a;
    const baseUrl = url.split("/").slice(0, 3).join("/");
    try {
      return yield axios.get(url, { headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl }) });
    } catch (error) {
      if (((_a = error.response) == null ? void 0 : _a.status) === 403 && openWebView) {
        console.log(`WAF detected (403) for ${url}, using solver...`);
        const wafResult = yield openWebView(baseUrl, {
          title: "Solve the captcha below and click done",
          description: "Required to bypass anti-bot protection.",
          headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl }),
          force: true,
          waitForCookie: "cf_clearance"
        });
        return yield axios.get(url, {
          headers: __spreadProps(__spreadValues({}, headers), {
            Referer: baseUrl,
            Cookie: wafResult.cookies || wafResult.cookie
          })
        });
      }
      throw error;
    }
  });
}
__name(getWithWAF, "getWithWAF");
function parseSvelteData(html) {
  const match = html.match(/resolve\(\{\s*id:\s*\d+,\s*data:/);
  if (!match || match.index === void 0) return null;
  const start = match.index + match[0].length;
  const errorIdx = html.indexOf(",error:", start);
  if (errorIdx === -1) return null;
  const dataStr = html.substring(start, errorIdx);
  try {
    return Function(`"use strict"; return (${dataStr});`)();
  } catch (e) {
    return null;
  }
}
__name(parseSvelteData, "parseSvelteData");
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    try {
      const { axios, cheerio, openWebView, commonHeaders } = providerContext;
      const baseUrl = yield getBaseUrl("kat");
      const url = new URL(link, `${baseUrl}/`).href;
      const res = yield getWithWAF(url, axios, openWebView, commonHeaders);
      const data = res.data;
      const parsed = parseSvelteData(data);
      const postContent = ((_a = parsed == null ? void 0 : parsed.data) == null ? void 0 : _a.post_content) || "";
      const page$ = cheerio.load(data);
      const $ = cheerio.load(
        postContent ? `<div class="entry-content">${postContent}</div>` : data
      );
      const container = $(".yQ8hqd.ksSzJd.LoQAYe").html() ? $(".yQ8hqd.ksSzJd.LoQAYe") : $(".FxvUNb");
      const imdbId = ((_b = container.find('a[href*="imdb.com/title/tt"]:not([href*="imdb.com/title/tt/"])').attr("href")) == null ? void 0 : _b.split("/")[4]) || ((_d = (_c = $('a[href*="imdb.com/title/tt"]').attr("href")) == null ? void 0 : _c.match(/tt\d+/)) == null ? void 0 : _d[0]) || ((_e = data.match(/imdb\.com\/title\/(tt\d+)/i)) == null ? void 0 : _e[1]) || postContent && ((_f = postContent.match(/imdb\.com\/title\/(tt\d+)/i)) == null ? void 0 : _f[1]) || "";
      const pageTitle = page$("title").text().replace(/^Download\s+/i, "").trim() || ((_g = page$('meta[property="og:title"]').attr("content")) == null ? void 0 : _g.replace(/^Download\s+/i, "").trim()) || $("h1, .entry-title").first().text().replace(/^Download\s+/i, "").trim();
      let title = container.find('li:contains("Name")').children().remove().end().text().trim();
      if (!title) {
        title = $("h3, h2").first().text().replace(/^Download\s+/i, "").trim();
      }
      if (!title) {
        title = pageTitle.replace(/\[.*?\]|\(.*?\)|\|.*/g, "").trim();
      }
      const isSeries = /season\s*\d+/i.test(pageTitle) || /\[\s*s\d{1,2}\s*\]/i.test(pageTitle) || /(?:^|\b)(?:season|episode)\b/i.test(postContent || data) && !pageTitle.toLowerCase().includes("full movie") || $(".yQ8hqd.ksSzJd.LoQAYe").length > 0;
      const type = isSeries ? "series" : "movie";
      let synopsis = container.find('li:contains("Stars"), li:contains("Storyline")').text().trim();
      if (!synopsis) {
        synopsis = $('p:contains("Storyline"), h2:contains("Storyline")').next("p").text().trim() || page$('meta[name="description"]').attr("content") || "";
      }
      const image = $('h4:contains("SCREENSHOTS")').next().find("img").attr("src") || $('img[src*="amazon.com"], img[src*="tmdb.org"]').first().attr("src") || $(".entry-content img").first().attr("src") || page$('meta[property="og:image"]').attr("content") || "";
      console.log("katGetInfo", title, synopsis, image, imdbId, type);
      const links = [];
      const directLink = [];
      $(".entry-content").find('p:contains("Episode")').each((i, element) => {
        const dlLink = $(element).nextAll("h3,h2").first().find('a:contains("1080"),a:contains("720"),a:contains("480"),a:contains("HEVC")').attr("href") || "";
        const dlTitle = $(element).text().trim();
        if (dlLink.trim().length > 0 && dlTitle.includes("Episode")) {
          directLink.push({
            title: dlTitle,
            link: dlLink,
            type: "series"
          });
        }
      });
      if (directLink.length > 0) {
        links.push({
          quality: "",
          title,
          directLinks: directLink
        });
      }
      $(".entry-content a").each((i, element) => {
        var _a2;
        const aHref = $(element).attr("href") || "";
        const aText = $(element).text().trim().replace(/\s+/g, " ");
        if (!aHref || aHref === "#" || !aHref.startsWith("http") || aHref.includes("imdb.com") || aHref.includes("catimages") || aText.toLowerCase().includes("sample") || aText.toLowerCase().includes("online") || aText.toLowerCase().includes("trailer") || aHref.includes("/directlink")) {
          return;
        }
        if (/links\.(?:kmhd|kmphotos)\.[a-z]+\/(?:file|pack)\/[\w-]+/i.test(aHref) || /(?:480|720|1080|2160|4k)/i.test(aText) || aHref.includes("gdflix") || aHref.includes("hubcloud")) {
          let linkTitle = $(element).parent("h2, h3, h4, h5, p").text().trim().replace(/[\r\n\t]+/g, " ");
          if (!linkTitle || linkTitle === aText || linkTitle.length < 4) {
            linkTitle = aText;
          }
          const quality = ((_a2 = (linkTitle + " " + aText).match(/\b(480p|720p|1080p|2160p|4k)\b/i)) == null ? void 0 : _a2[0]) || "";
          const isPack = aHref.includes("/pack/");
          if (type === "movie") {
            if (!links.some((l) => {
              var _a3, _b2;
              return ((_b2 = (_a3 = l.directLinks) == null ? void 0 : _a3[0]) == null ? void 0 : _b2.link) === aHref;
            })) {
              links.push({
                quality,
                title: linkTitle,
                directLinks: [{ link: aHref, title: linkTitle, type: "movie" }]
              });
            }
          } else {
            if (isPack) {
              if (!links.some((l) => l.episodesLink === aHref)) {
                links.push({
                  quality,
                  title: linkTitle,
                  episodesLink: aHref
                });
              }
            } else {
              const alreadyInDirect = links.some(
                (l) => {
                  var _a3;
                  return (_a3 = l.directLinks) == null ? void 0 : _a3.some((dl) => dl.link === aHref);
                }
              );
              if (!alreadyInDirect) {
                const firstGroup = links.find((l) => l.directLinks && l.directLinks.length > 0);
                if (firstGroup && firstGroup.directLinks) {
                  firstGroup.directLinks.push({
                    title: linkTitle,
                    link: aHref,
                    type: "series"
                  });
                } else {
                  links.push({
                    quality,
                    title: linkTitle,
                    directLinks: [{ link: aHref, title: linkTitle, type: "series" }]
                  });
                }
              }
            }
          }
        }
      });
      const quickDownload = yield (_h = providerContext.kvStore) == null ? void 0 : _h.get("katmovies_quickDownload");
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
            const skipTimings = yield (_i = providerContext.kvStore) == null ? void 0 : _i.get("katmovies_skipTimings");
            websiteInfo.linkList = yield Promise.all(
              websiteInfo.linkList.map((item) => __async(null, null, function* () {
                const season = getCinemetaSeason(item.title) || getCinemetaSeason(title);
                if (!season) return item;
                if (item.directLinks) {
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
                      console.warn("KatMovies: Skip timings failed", e);
                    }
                  }
                  return __spreadProps(__spreadValues({}, item), {
                    directLinks: enriched
                  });
                }
                if (item.episodesLink) {
                  return __spreadProps(__spreadValues({}, item), {
                    episodesLink: addCinemetaContext(
                      new URL(item.episodesLink, url).href,
                      imdbId,
                      season
                    )
                  });
                }
                return item;
              }))
            );
          }
          return applyCinemetaMeta(websiteInfo, cinemeta);
        }
      } catch (e) {
        return websiteInfo;
      }
      return websiteInfo;
    } catch (err) {
      throwProviderError("KatMovies", "metadata", err);
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

