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

// providers/kmMovies/meta.ts
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

// providers/kmMovies/meta.ts
var kmmHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Pragma: "no-cache",
  "Cache-Control": "no-cache"
};
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
          waitForCookie: "cf_clearance"
        });
        return yield axios.get(url, {
          headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl, Cookie: wafResult.cookies })
        });
      }
      throw error;
    }
  });
}
__name(getWithWAF, "getWithWAF");
function resolvePostUrl(link, baseUrl) {
  const currentBaseUrl = new URL(baseUrl);
  const postUrl = new URL(link, `${baseUrl}/`);
  if (postUrl.hostname.includes("kmmovies")) {
    return new URL(`${postUrl.pathname}${postUrl.search}`, currentBaseUrl).href;
  }
  return postUrl.href;
}
__name(resolvePostUrl, "resolvePostUrl");
function getQuality(title) {
  const match = title.match(/\b(480|720|1080|2160)p\b/i);
  return match ? `${match[1]}p` : "AUTO";
}
__name(getQuality, "getQuality");
function getVersionTitle(anchor, $) {
  if ($(anchor).hasClass("webdl")) return "WebDL Version";
  if ($(anchor).hasClass("encoded")) return "Encoded Version";
  return "";
}
__name(getVersionTitle, "getVersionTitle");
function extractImdbId($, html) {
  var _a, _b;
  const imdbUrl = $("a[href*='imdb.com/title/tt']").first().attr("href") || "";
  return ((_a = imdbUrl.match(/tt\d+/i)) == null ? void 0 : _a[0]) || ((_b = html.match(/tt\d{7,}/i)) == null ? void 0 : _b[0]) || "";
}
__name(extractImdbId, "extractImdbId");
function extractLinkList($, pageUrl) {
  const links = [];
  const seen = /* @__PURE__ */ new Set();
  $(".type-content[data-type]").each((_, container) => {
    const group = $(container).attr("data-type") || "";
    if (group.startsWith("zip-")) return;
    const isEpisodeGroup = group.startsWith("episodes-");
    const groupTitle = group.startsWith("combined-") ? "Combined" : "Episode Wise";
    $(container).find("a.dl-btn[href]").each((__, anchor) => {
      var _a;
      const href = (_a = $(anchor).attr("href")) == null ? void 0 : _a.trim();
      const label = $(anchor).text().replace(/\s+/g, " ").trim();
      if (!href || !label) return;
      const versionTitle = getVersionTitle(anchor, $);
      const title = [versionTitle, groupTitle, label].filter(Boolean).join(" - ");
      const resolvedUrl = new URL(href, pageUrl).href;
      const key = `${versionTitle}:${group}:${resolvedUrl}`;
      if (seen.has(key)) return;
      seen.add(key);
      const link = {
        title,
        quality: getQuality(label)
      };
      if (isEpisodeGroup) {
        link.episodesLink = resolvedUrl;
      } else {
        link.directLinks = [
          {
            title,
            link: resolvedUrl,
            type: "series"
          }
        ];
      }
      links.push(link);
    });
  });
  if (links.length > 0) return links;
  $("a.dl-btn[href]").each((_, anchor) => {
    var _a;
    const group = $(anchor).closest(".type-content[data-type]").attr("data-type");
    if (group == null ? void 0 : group.startsWith("zip-")) return;
    const href = (_a = $(anchor).attr("href")) == null ? void 0 : _a.trim();
    const label = $(anchor).text().replace(/\s+/g, " ").trim();
    if (!href || !label) return;
    const versionTitle = getVersionTitle(anchor, $);
    const title = versionTitle ? `${versionTitle} - ${label}` : `Download ${label}`;
    const resolvedUrl = new URL(href, pageUrl).href;
    const key = `${versionTitle}:${resolvedUrl}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({
      title,
      quality: getQuality(label),
      directLinks: [
        {
          title,
          link: resolvedUrl,
          type: "movie"
        }
      ]
    });
  });
  return links;
}
__name(extractLinkList, "extractLinkList");
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c, _d, _e, _f;
    try {
      const { axios, cheerio, openWebView, commonHeaders } = providerContext;
      const reqHeaders = __spreadValues(__spreadValues({}, kmmHeaders), commonHeaders || {});
      const baseUrl = yield getBaseUrl("kmmovies");
      const pageUrl = resolvePostUrl(link, baseUrl);
      const res = yield getWithWAF(pageUrl, axios, openWebView, reqHeaders);
      const html = String(res.data || "");
      const $ = cheerio.load(html);
      const overview = $("#movie-overview");
      const title = overview.find(".hero-title").first().text().trim() || $("h1").first().text().trim() || ((_a = $("meta[property='og:title']").attr("content")) == null ? void 0 : _a.trim()) || $("title").text().trim() || "Unknown";
      const backdropStyle = overview.find(".hero-backdrop").first().attr("style");
      const backdropPath = (_b = backdropStyle == null ? void 0 : backdropStyle.match(
        /background-image:\s*url\(["']?([^"')]+)["']?\)/i
      )) == null ? void 0 : _b[1];
      const imagePath = backdropPath || overview.find("img.hero-poster").first().attr("src") || overview.find("img.hero-poster").first().attr("data-src") || $("meta[property='og:image']").attr("content") || $("meta[name='twitter:image']").attr("content") || "";
      const image = imagePath ? new URL(imagePath, pageUrl).href : "";
      const synopsis = overview.find(".hero-description").first().text().replace(/\s+/g, " ").trim() || ((_c = $("meta[property='og:description']").attr("content")) == null ? void 0 : _c.trim()) || ((_d = $("meta[name='description']").attr("content")) == null ? void 0 : _d.trim()) || "";
      const ratingValue = (_e = overview.find(".meta-pill.rating-star").first().text().match(/[0-9]+(?:\.[0-9]+)?/)) == null ? void 0 : _e[0];
      const rating = ratingValue ? `${ratingValue}/10` : "";
      const imdbId = extractImdbId($, html);
      const tags = [
        ...new Set(
          $("a[href*='/genre/']").map((_, element) => {
            const href = $(element).attr("href") || "";
            const path = new URL(href, pageUrl).pathname;
            return path !== "/genre/" ? $(element).text().replace(/\s+/g, " ").trim() : "";
          }).get().filter(Boolean)
        )
      ];
      const cast = $("a[href*='/actor/']").map((_, element) => $(element).text().replace(/\s+/g, " ").trim()).get().filter(Boolean);
      const linkList = extractLinkList($, pageUrl);
      const type = $(".type-content[data-type^='episodes-']").length > 0 || /\bS\d{1,2}\b/i.test(title) ? "series" : "movie";
      const quickDownload = yield (_f = providerContext.kvStore) == null ? void 0 : _f.get("kmMovies_quickDownload");
      const websiteInfo = {
        title,
        synopsis,
        image,
        imdbId: imdbId || "",
        type,
        quickDownload: quickDownload != null ? quickDownload : true,
        tags,
        cast,
        rating,
        linkList,
        webUrl: pageUrl
      };
      if (!imdbId) return websiteInfo;
      try {
        const cinemeta = yield getCinemetaMeta(imdbId, type, providerContext);
        if (cinemeta) {
          if (type === "series" && cinemeta.type === "series") {
            websiteInfo.linkList = websiteInfo.linkList.map((item) => {
              if (!item.episodesLink) return item;
              const season = getCinemetaSeason(item.title) || getCinemetaSeason(title);
              if (!season) return item;
              return __spreadProps(__spreadValues({}, item), {
                episodesLink: addCinemetaContext(item.episodesLink, imdbId, season)
              });
            });
          }
          return applyCinemetaMeta(websiteInfo, cinemeta);
        }
      } catch (e) {
        console.warn("KMMovies: Cinemeta lookup failed", e);
      }
      return websiteInfo;
    } catch (err) {
      throwProviderError("KMMovies", "metadata", err);
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

