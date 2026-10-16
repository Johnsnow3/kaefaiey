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

// providers/drive/meta.ts
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

// providers/drive/meta.ts
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c;
    try {
      const { axios, cheerio } = providerContext;
      const currentBaseUrl = yield getBaseUrl("drive");
      const url = new URL(link, `${currentBaseUrl}/`).href;
      const res = yield axios.get(url, { headers: providerContext.commonHeaders });
      const data = res.data;
      const $ = cheerio.load(data);
      const pageTitle = $("h1, .entry-title, title").first().text().replace("Download", "").trim();
      const pageBody = $("body").text();
      const isSeries = (/season\s*\d+/i.test(pageTitle) || /\b(s\d{1,2}|s\d{1,2}\s*-\s*\d{1,2})\b/i.test(pageTitle) || /single episode/i.test(pageBody) || /\[\s*\d+.*\/e\s*\]/i.test(pageBody)) && !pageTitle.toLowerCase().includes("full movie");
      const type = isSeries ? "series" : "movie";
      const imdbId = ((_b = (_a = $('a[href*="imdb.com/title/tt"]').attr("href")) == null ? void 0 : _a.match(/tt\d+/)) == null ? void 0 : _b[0]) || "";
      let title = $('strong:contains("Name"), h5:contains("Name"), p:contains("Name:")').first().text().replace(/.*?(?:Movie|Series)\s*Name:\s*/i, "").replace(/\[.*?\]|\(.*?\)|\|.*/g, "").trim() || pageTitle.replace(/\[.*?\]|\(.*?\)|\|.*/g, "").trim();
      const synopsis = $('h2:contains("Storyline"), h3:contains("Storyline"), h4:contains("Storyline"), h5:contains("Storyline"), p:contains("Storyline")').first().next("p").text().trim() || $('p:contains("Storyline:")').text().replace(/.*?Storyline:\s*/i, "").trim() || $(".ipc-html-content-inner-div").text().trim() || "";
      const image = $("img.entered.lazyloaded, img.entered, img.litespeed-loaded, .post-inner img, .entry-content img, img.aligncenter").first().attr("src") || "";
      const links = [];
      $("a").each((i, a) => {
        var _a2;
        const aText = $(a).text().trim().replace(/\s+/g, " ");
        const aHref = $(a).attr("href") || "";
        if (!aHref || aHref === "#" || aHref.startsWith("javascript:") || aHref.includes("/?s=") || aHref.includes("search.php") || aHref.includes("moviesdrive") || aHref.includes("moviesdrives") || aHref.includes("moviedrive") || aHref.includes("imdb.com") || aText.toLowerCase().includes("zip") || aHref.toLowerCase().includes("zip") || aText.toLowerCase().includes("sample") || aText.toLowerCase().includes("trailer") || aText.toLowerCase().includes("notice")) {
          return;
        }
        const isDownloadAnchor = /archive\/\d+/i.test(aHref) || /hubcloud|gdflix|fastdl|drive/i.test(aHref) || /(?:480|720|1080|2160|4k)/i.test(aText) || /single episode/i.test(aText) || /download/i.test(aText);
        if (isDownloadAnchor && /^https?:\/\//i.test(aHref)) {
          let linkTitle = $(a).parent("h5, h4, h3, p").prev("h5, h4, h3, p").text().trim().replace(/\s+/g, " ");
          if (!linkTitle || linkTitle.length < 5 || linkTitle.includes("Download Links")) {
            linkTitle = $(a).parent().text().trim().replace(/\s+/g, " ");
          }
          if (!linkTitle || linkTitle === aText) {
            linkTitle = aText;
          }
          linkTitle = linkTitle.replace(/[\r\n\t]+/g, " ").replace(/^[\s•\-*—_:=~|]+|[\s•\-*—_:=~|]+$/g, "").trim();
          const quality = ((_a2 = (linkTitle + " " + aText).match(/\b(480p|720p|1080p|2160p|4k)\b/i)) == null ? void 0 : _a2[0]) || "";
          if (type === "series") {
            const seasonMatch = (linkTitle + " " + pageTitle).match(/Season\s*\d+/i);
            if (seasonMatch && !linkTitle.toLowerCase().includes("season")) {
              linkTitle = `${seasonMatch[0]} ${quality || linkTitle}`.trim();
            }
          }
          if (!links.some((l) => {
            var _a3;
            return l.episodesLink === aHref || l.directLinks && ((_a3 = l.directLinks[0]) == null ? void 0 : _a3.link) === aHref;
          })) {
            if (type === "movie") {
              links.push({
                title: linkTitle,
                quality,
                directLinks: [{ title: "Movie", link: aHref, type: "movie" }]
              });
            } else {
              links.push({
                title: linkTitle,
                quality,
                episodesLink: aHref
              });
            }
          }
        }
      });
      console.log("drive meta", links, type);
      const quickDownload = yield (_c = providerContext.kvStore) == null ? void 0 : _c.get("drive_quickDownload");
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
            websiteInfo.linkList = websiteInfo.linkList.map((item) => {
              if (!item.episodesLink) return item;
              const season = getCinemetaSeason(item.title);
              if (!season) return item;
              return __spreadProps(__spreadValues({}, item), {
                episodesLink: addCinemetaContext(
                  new URL(item.episodesLink, url).href,
                  imdbId,
                  season
                )
              });
            });
          }
          return applyCinemetaMeta(websiteInfo, cinemeta);
        }
      } catch (e) {
        return websiteInfo;
      }
      return websiteInfo;
    } catch (err) {
      throwProviderError("Drive", "metadata", err);
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

