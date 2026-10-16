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

// providers/movies4u/meta.ts
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

// providers/movies4u/meta.ts
var headers = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Cache-Control": "no-store",
  "Accept-Language": "en-US,en;q=0.9",
  DNT: "1",
  "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  Cookie: "xla=s4t; _ga=GA1.1.1081149560.1756378968; _ga_BLZGKYN5PF=GS2.1.s1756378968$o1$g1$t1756378984$j44$l0$h0",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
};
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c;
    const { axios, cheerio } = providerContext;
    const baseUrl = yield getBaseUrl("movies4u");
    const url = new URL(link, `${baseUrl}/`).href;
    try {
      let response = yield axios.get(url, {
        headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl })
      });
      if (response.data && response.data.includes("Please turn JavaScript on and reload the page.")) {
        const b1Match = response.data.match(/var b1=atob\(['"]([^'"]+)['"]\)/);
        const a2Match = response.data.match(/_0x2aa8=\[['"]([^'"]+)['"]\]/);
        const c3Match = response.data.match(/c3=toNumbers\(['"]([^'"]+)['"]\)/);
        if (b1Match && a2Match && c3Match) {
          const unescapeHexStr = /* @__PURE__ */ __name((str) => str.replace(
            /\\x([0-9A-Fa-f]{2})/g,
            (_, hex) => String.fromCharCode(parseInt(hex, 16))
          ), "unescapeHexStr");
          const minJsRes = yield axios.get(`${baseUrl}/min.js`, {
            headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl })
          });
          const b1Hex = atob(unescapeHexStr(b1Match[1]));
          const a2Hex = atob(unescapeHexStr(a2Match[1]));
          const c3Hex = unescapeHexStr(c3Match[1]);
          const solver = new Function(
            "c3Hex",
            "a1Hex",
            "b2Hex",
            `
          ${minJsRes.data}
          function toNumbers(d){var e=[];d.replace(/(..)/g,function(d){e.push(parseInt(d,16))});return e}
          function toHex(){for(var d=[],d=1==arguments.length&&arguments[0].constructor==Array?arguments[0]:arguments,e='',f=0;f<d.length;f++)e+=(16>d[f]?'0':'')+d[f].toString(16);return e.toLowerCase()}
          return toHex(slowAES.decrypt(toNumbers(c3Hex), 2, toNumbers(a1Hex), toNumbers(b2Hex)));
        `
          );
          const decrypted = solver(c3Hex, a2Hex, b1Hex);
          const newCookie = `Antiddos-systems-DH=${decrypted}`;
          response = yield axios.get(url, {
            headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl, Cookie: newCookie })
          });
        }
      }
      const $ = cheerio.load(response.data);
      const infoContainer = $(".entry-content, .post-inner").length ? $(".entry-content, .post-inner") : $("body");
      const result = {
        title: "",
        synopsis: "",
        image: "",
        imdbId: "",
        type: "movie",
        linkList: []
      };
      const infoParagraph = $("h2.movie-title").next("p").text();
      if (infoParagraph.includes("Season:") || infoParagraph.includes("Episode:") || infoParagraph.includes("SHOW Name:")) {
        result.type = "series";
      } else {
        result.type = "movie";
      }
      const rawTitle = $("h1").text().trim() || $("h2").text().trim();
      result.title = rawTitle.split(/\[| \d+p| x\d+/)[0].trim();
      const showNameMatch = infoParagraph.match(/SHOW Name: (.+)/) || infoParagraph.match(/Name: (.+)/);
      if (showNameMatch && showNameMatch[1]) {
        result.title = result.title || showNameMatch[1].trim();
      }
      const imdbMatch = ((_a = infoContainer.html()) == null ? void 0 : _a.match(/tt\d+/)) || ((_b = $("a[href*='imdb.com/title/']").attr("href")) == null ? void 0 : _b.match(/tt\d+/));
      result.imdbId = imdbMatch ? imdbMatch[0] : "";
      let image = infoContainer.find(".post-thumbnail img").attr("src") || infoContainer.find("img[src]").first().attr("src") || "";
      if (image.startsWith("//")) image = "https:" + image;
      else if (image.startsWith("/")) image = baseUrl + image;
      if (image.includes("no-thumbnail") || image.includes("placeholder"))
        image = "";
      result.image = image;
      const links = [];
      const hElements = infoContainer.find("h3, h4, p");
      hElements.each((index, element) => {
        var _a2;
        const el = $(element);
        const titleText = el.text().trim();
        const qualityMatch = (_a2 = titleText.match(/\d+p\b/)) == null ? void 0 : _a2[0];
        const fullTitle = titleText;
        const downloadButtons = el.nextAll().find("a").first();
        if (downloadButtons.length && qualityMatch && titleText.length < 350) {
          if (result.type === "series") {
            links.push({
              title: fullTitle,
              quality: qualityMatch,
              episodesLink: downloadButtons.attr("href") || "",
              directLinks: []
            });
          } else {
            const directLinks = [];
            const link2 = downloadButtons.attr("href");
            if (link2) {
              directLinks.push({
                title: downloadButtons.text().trim() || "Download",
                link: link2,
                type: "movie"
                // literal type
              });
            }
            if (directLinks.length) {
              links.push({
                title: fullTitle,
                quality: qualityMatch,
                episodesLink: "",
                directLinks
              });
            }
          }
        }
      });
      const uniqueLinks = /* @__PURE__ */ new Map();
      links.forEach((link2) => {
        var _a2, _b2;
        const href = link2.episodesLink || ((_b2 = (_a2 = link2.directLinks) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.link);
        if (href && !uniqueLinks.has(href)) {
          uniqueLinks.set(href, link2);
        }
      });
      result.linkList = Array.from(uniqueLinks.values());
      result.webUrl = url;
      const quickDownload = yield (_c = providerContext.kvStore) == null ? void 0 : _c.get("movies4u_quickDownload");
      result.quickDownload = Boolean(quickDownload);
      const imdbId = result.imdbId;
      if (!imdbId) return result;
      try {
        const cinemeta = yield getCinemetaMeta(
          imdbId,
          result.type,
          providerContext
        );
        if (cinemeta) {
          if (result.type === "series" && cinemeta.type === "series") {
            result.linkList = result.linkList.map((item) => {
              if (!item.episodesLink) return item;
              const season = getCinemetaSeason(item.title) || getCinemetaSeason(infoParagraph) || getCinemetaSeason(rawTitle);
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
          return applyCinemetaMeta(result, cinemeta);
        }
      } catch (e) {
        console.warn("Movies4u: Cinemeta lookup failed", e);
      }
      return result;
    } catch (err) {
      throwProviderError("Movies4u", "metadata", err);
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

