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

// providers/hdhub4u/posts.ts
var posts_exports = {};
__export(posts_exports, {
  getPosts: () => getPosts,
  getSearchPosts: () => getSearchPosts
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

// providers/hdhub4u/posts.ts
var hdbHeaders = {
  Cookie: "xla=s4t",
  Referer: "https://google.com",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
};
var getPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    filter,
    page,
    signal,
    providerContext
  }) {
    const baseUrl = yield getBaseUrl("hdhub");
    const url = `${baseUrl + filter}/page/${page}/`;
    return posts({ baseUrl, url, signal, providerContext });
  });
}, "getPosts");
var getSearchPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    page,
    signal,
    providerContext
  }) {
    const baseUrl = yield getBaseUrl("hdhub");
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const params = new URLSearchParams({
        q: searchQuery,
        query_by: "post_title,category,stars,director,imdb_id",
        query_by_weights: "4,2,2,2,4",
        sort_by: "sort_by_date:desc",
        limit: "15",
        highlight_fields: "none",
        use_cache: "true",
        page: String(page),
        analytics_tag: today
      });
      const searchUrl = `https://search.pingora.fyi/collections/post/documents/search?${params.toString()}`;
      const res = yield fetch(searchUrl, {
        headers: __spreadProps(__spreadValues({}, hdbHeaders), {
          Referer: baseUrl + "/",
          Accept: "application/json, text/plain, */*"
        }),
        signal
      });
      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status} ${res.statusText} | URL ${searchUrl}`
        );
      }
      const json = yield res.json();
      const hits = Array.isArray(json == null ? void 0 : json.hits) ? json.hits : [];
      const catalog = [];
      for (const hit of hits) {
        const doc = (hit == null ? void 0 : hit.document) || {};
        const title = String(doc.post_title || "").replace(/Download/gi, "").trim();
        const permalink = String(doc.permalink || "");
        const image = String(doc.post_thumbnail || "");
        if (!title || !permalink) continue;
        const postUrl = new URL(permalink, `${baseUrl}/`);
        const link = `${postUrl.pathname}${postUrl.search}${postUrl.hash}`;
        catalog.push({ title, link, image });
      }
      return catalog;
    } catch (err) {
      throwProviderError("HDHub4u", "search posts", err);
    }
  });
}, "getSearchPosts");
function posts(_0) {
  return __async(this, arguments, function* ({
    baseUrl,
    url,
    signal,
    providerContext
  }) {
    const { cheerio } = providerContext;
    try {
      const res = yield fetch(url, {
        headers: hdbHeaders,
        signal
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} | URL ${url}`);
      }
      const data = yield res.text();
      const $ = cheerio.load(data);
      const catalog = [];
      $(".recent-movies").children().map((i, element) => {
        const title = $(element).find("figure").find("img").attr("alt");
        const link = $(element).find("a").attr("href");
        const image = $(element).find("figure").find("img").attr("src");
        if (title && link && image) {
          const postUrl = new URL(link, `${baseUrl}/`);
          catalog.push({
            title: title.replace("Download", "").trim(),
            link: `${postUrl.pathname}${postUrl.search}${postUrl.hash}`,
            image
          });
        }
      });
      return catalog;
    } catch (err) {
      throwProviderError("HDHub4u", "posts", err);
    }
  });
}
__name(posts, "posts");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

