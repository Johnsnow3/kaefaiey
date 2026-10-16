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

// providers/1cinevood/meta.ts
var meta_exports = {};
__export(meta_exports, {
  getMeta: () => getMeta
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

// providers/getCinemetaMeta.ts
var CINEMETA_BASE_URL = "https://v3-cinemeta.strem.io/meta";
var CONTEXT_KEY = "cinemetaMeta";
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

// providers/getBaseUrl.ts
var urlsEndpoint = "https://raw.githubusercontent.com/Zenda-Cross/vega-providers/refs/heads/main/urls.json";
var cacheTtl = 60 * 60 * 1e3;
function getCache2() {
  var _a;
  const state = typeof providerGlobal !== "undefined" && providerGlobal ? providerGlobal : globalThis;
  (_a = state.__vegaProviderBaseUrlCache__) != null ? _a : state.__vegaProviderBaseUrlCache__ = { expiresAt: 0 };
  return state.__vegaProviderBaseUrlCache__;
}
__name(getCache2, "getCache");
function fetchProviderUrls() {
  return __async(this, null, function* () {
    const cache = getCache2();
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

// providers/1cinevood/helper.ts
var resolvedBaseUrl = "";
function getCinewoodBaseUrl() {
  return __async(this, null, function* () {
    if (resolvedBaseUrl) return resolvedBaseUrl;
    try {
      let url = yield getBaseUrl("1cinevood");
      if (!url || url.includes("cinevood.rocks")) {
        try {
          const res = yield fetch(url || "https://cinevood.rocks", {
            method: "HEAD",
            redirect: "follow"
          });
          if (res.url) {
            resolvedBaseUrl = new URL(res.url).origin;
            return resolvedBaseUrl;
          }
        } catch (e) {
        }
        resolvedBaseUrl = "https://new1.cinevood.cv";
        return resolvedBaseUrl;
      }
      resolvedBaseUrl = url.replace(/\/+$/, "");
      return resolvedBaseUrl;
    } catch (e) {
      return "https://new1.cinevood.cv";
    }
  });
}
__name(getCinewoodBaseUrl, "getCinewoodBaseUrl");
function isWafChallenge(html) {
  if (!html || typeof html !== "string") return false;
  return html.includes("<title>Just a moment...</title>") || html.includes("challenges.cloudflare.com") || html.includes("cf-mitigated") || html.includes("cf-chl-widget") || html.includes("Attention Required! | Cloudflare") || html.includes("Cloudflare Ray ID") && html.includes("Please wait");
}
__name(isWafChallenge, "isWafChallenge");
function getWithWAF(url, axios, openWebView, headers) {
  return __async(this, null, function* () {
    var _a;
    const baseUrl = url.split("/").slice(0, 3).join("/");
    try {
      return yield axios.get(url, { headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl }) });
    } catch (error) {
      if (((_a = error.response) == null ? void 0 : _a.status) === 403 && openWebView) {
        console.log(`WAF detected (403) for ${url}, using solver...`);
        const wafResult = yield openWebView(url, {
          title: "Solve the captcha below and click done",
          description: "Required to bypass anti-bot protection.",
          headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl }),
          waitForCookie: "cf_clearance",
          force: true
        });
        if (wafResult.data && !isWafChallenge(wafResult.data) && wafResult.data.trim().length > 50) {
          return { data: wafResult.data };
        }
        const targetUrl = wafResult.url || url;
        const targetBaseUrl = targetUrl.split("/").slice(0, 3).join("/");
        return yield axios.get(targetUrl, {
          headers: __spreadProps(__spreadValues({}, headers), {
            Referer: targetBaseUrl,
            "User-Agent": wafResult.userAgent || headers["User-Agent"],
            Cookie: wafResult.cookies || wafResult.cookie
          })
        });
      }
      throw error;
    }
  });
}
__name(getWithWAF, "getWithWAF");

// providers/1cinevood/meta.ts
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c, _d;
    const { axios, cheerio, commonHeaders, openWebView } = providerContext;
    const baseUrl = yield getCinewoodBaseUrl();
    const url = new URL(link, `${baseUrl}/`).href;
    try {
      const response = yield getWithWAF(url, axios, openWebView, commonHeaders);
      const $ = cheerio.load(response.data);
      const infoContainer = $(".entry-content, .post-inner").first();
      const cleanText = /* @__PURE__ */ __name((value) => value ? $("<div>").html(value).text().replace(/\s+/g, " ").trim() : "", "cleanText");
      const schemaNodes = [];
      $('script[type="application/ld+json"]').each((_, script) => {
        try {
          const schema = JSON.parse($(script).html() || "");
          const roots = Array.isArray(schema) ? schema : [schema];
          roots.forEach((root) => {
            schemaNodes.push(root);
            if (Array.isArray(root == null ? void 0 : root["@graph"])) {
              schemaNodes.push(...root["@graph"]);
            }
          });
        } catch (e) {
        }
      });
      const hasSchemaType = /* @__PURE__ */ __name((node, type) => {
        const types = Array.isArray(node == null ? void 0 : node["@type"]) ? node["@type"] : [node == null ? void 0 : node["@type"]];
        return types.some(
          (value) => typeof value === "string" && value.toLowerCase() === type
        );
      }, "hasSchemaType");
      const mediaSchema = schemaNodes.find((node) => hasSchemaType(node, "movie")) || schemaNodes.find((node) => hasSchemaType(node, "tvseries")) || schemaNodes.find((node) => hasSchemaType(node, "tvepisode"));
      const result = {
        title: "",
        synopsis: "",
        image: "",
        imdbId: "",
        type: "movie",
        linkList: []
      };
      result.title = cleanText($(".cv-movie-title").first().text()) || cleanText(mediaSchema == null ? void 0 : mediaSchema.name) || cleanText($("#movie_title a").first().text()) || cleanText($("meta[property='og:title']").attr("content")) || cleanText($("h1.entry-title, h1.single-title").first().text()) || cleanText($("title").first().text()) || "Unknown Title";
      const firstDownloadHeadingText = infoContainer.find("h5,h6").first().text();
      const isSeries = /\bS\d{1,2}(?:E\d{1,3})?\b/i.test(firstDownloadHeadingText) || /\bE\d{1,3}\b/i.test(firstDownloadHeadingText) || firstDownloadHeadingText.toLowerCase().includes("season") || hasSchemaType(mediaSchema, "tvseries") || hasSchemaType(mediaSchema, "tvepisode") || /\b(?:series|season)\b/i.test($(".cv-card-download-info").first().text());
      result.type = isSeries ? "series" : "movie";
      const imdbMatch = ((_a = $("a[href*='imdb.com/title/tt']").first().attr("href")) == null ? void 0 : _a.match(/tt\d+/)) || String((mediaSchema == null ? void 0 : mediaSchema.sameAs) || (mediaSchema == null ? void 0 : mediaSchema.url) || "").match(/tt\d+/);
      result.imdbId = imdbMatch ? imdbMatch[0] : "";
      const schemaImage = typeof (mediaSchema == null ? void 0 : mediaSchema.image) === "string" ? mediaSchema.image : ((_b = mediaSchema == null ? void 0 : mediaSchema.image) == null ? void 0 : _b.url) || ((_c = mediaSchema == null ? void 0 : mediaSchema.image) == null ? void 0 : _c.contentUrl);
      let image = $(".cv-movie-poster-img").first().attr("src") || schemaImage || $("meta[property='og:image']").attr("content") || infoContainer.find('img[decoding="async"]').first().attr("src") || "";
      if (image.startsWith("//")) image = "https:" + image;
      result.image = image;
      result.synopsis = cleanText(
        $(".cv-movie-overview-box").first().clone().children().remove().end().text()
      ) || cleanText(mediaSchema == null ? void 0 : mediaSchema.description) || cleanText(
        infoContainer.find("#summary b:contains('Summary:')").parent().text().replace("Summary:", "")
      ) || cleanText($("meta[property='og:description']").attr("content")) || cleanText($("meta[name='description']").attr("content"));
      const links = [];
      const qualityBlocks = infoContainer.find("h5,h6").filter((_, el) => {
        const text = $(el).text();
        return !text.includes("Watch Online") && /\b(?:\d{3,4}p|2160p|4k|S\d{1,2}|E\d{1,3})\b/i.test(text);
      });
      qualityBlocks.each((index, element) => {
        var _a2, _b2;
        const el = $(element);
        const fullTitle = el.text().trim();
        const qualityMatch = ((_a2 = fullTitle.match(/\d{3,4}p\b/)) == null ? void 0 : _a2[0]) || "";
        const fileSizeMatch = ((_b2 = fullTitle.match(/\[([^\]]+)\](?=[^\[]*$)/)) == null ? void 0 : _b2[1]) || "";
        const nextSiblings = el.nextUntil("h5, h6, hr");
        nextSiblings.find("a").add(nextSiblings.filter("a")).each((i, btn) => {
          const btnEl = $(btn);
          const link2 = btnEl.attr("href");
          if (!link2 || link2 === "#" || link2.startsWith("javascript:") || !/(?:oxxfile|hubcloud)/i.test(link2)) {
            return;
          }
          const seMatch = fullTitle.match(/(S\d{2}E\d{2}|S\d{2}|E\d{2})/);
          const seasonEpisode = seMatch ? `${seMatch[0]} | ` : "";
          links.push({
            // Final title for the link entry (e.g., S01 | 1080p | 11.78 GB)
            title: `${seasonEpisode}${qualityMatch}${fileSizeMatch ? " | " + fileSizeMatch : ""}`.trim().replace(/\|$/, "").trim(),
            quality: qualityMatch,
            episodesLink: result.type === "series" ? link2 : "",
            directLinks: result.type === "movie" ? [{ link: link2 || "", title: "Movie", type: "movie" }] : void 0
          });
        });
      });
      if (result.type === "movie" && links.length === 0) {
        infoContainer.find('a[href*="oxxfile"],a[href*="hubcloud"]').each((_, anchor) => {
          const link2 = $(anchor).attr("href");
          if (!link2) return;
          links.push({
            title: $(anchor).text().trim() || "Movie",
            directLinks: [{ link: link2, title: "Movie", type: "movie" }]
          });
        });
      }
      result.linkList = links;
      result.webUrl = url;
      const quickDownload = yield (_d = providerContext.kvStore) == null ? void 0 : _d.get("1cinevood_quickDownload");
      result.quickDownload = Boolean(quickDownload);
      const imdbId = result.imdbId;
      if (!imdbId) return result;
      let cinemeta;
      try {
        cinemeta = yield getCinemetaMeta(imdbId, result.type, providerContext);
      } catch (error) {
        console.warn(
          `Cinemeta lookup failed for ${imdbId}; using scraped Cinewood metadata.`,
          error
        );
        return result;
      }
      if (cinemeta) {
        if (result.type === "series" && cinemeta.type === "series") {
          result.linkList = result.linkList.map((item) => {
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
        return applyCinemetaMeta(result, cinemeta);
      }
      return result;
    } catch (err) {
      throwProviderError("1CineVood", "metadata", err);
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

