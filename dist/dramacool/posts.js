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

// providers/dramacool/posts.ts
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

// providers/dramacool/posts.ts
var DEFAULT_BASE_URL = "https://asianc.id";
function resolveBaseUrl(providerContext) {
  return __async(this, null, function* () {
    try {
      if (providerContext && typeof providerContext.getBaseUrl === "function") {
        const resolved = (yield providerContext.getBaseUrl("dramacool")) || (yield providerContext.getBaseUrl("asianc"));
        if (resolved) {
          return resolved.replace(/\/+$/, "");
        }
      }
    } catch (e) {
    }
    try {
      const resolved = (yield getBaseUrl("dramacool")) || (yield getBaseUrl("asianc"));
      if (resolved) {
        return resolved.replace(/\/+$/, "");
      }
    } catch (e) {
    }
    return DEFAULT_BASE_URL;
  });
}
__name(resolveBaseUrl, "resolveBaseUrl");
function parseItems(html, cheerio, baseUrl) {
  const $ = cheerio.load(html);
  const posts = [];
  $("ul.list-episode-item li, ul.list-movie li, ul.list-star li").each(
    (_, element) => {
      var _a;
      const $el = $(element);
      const a = $el.find("a").first();
      const href = a.attr("href") || "";
      const title = $el.find("h3, .title").text().trim() || ((_a = a.attr("title")) == null ? void 0 : _a.trim()) || "";
      const rawImg = $el.find("img").attr("data-original") || $el.find("img").attr("src") || "";
      const tag = $el.find(".ep, .type").first().text().trim();
      if (title && href) {
        const link = href.startsWith("http") ? href : `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`;
        const image = rawImg.startsWith("http") ? rawImg : rawImg ? `${baseUrl}${rawImg.startsWith("/") ? "" : "/"}${rawImg}` : "";
        posts.push(__spreadValues({
          title,
          link,
          image,
          aspectRatio: 2 / 3
        }, tag ? { tag } : {}));
      }
    }
  );
  return posts;
}
__name(parseItems, "parseItems");
var getPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    filter,
    page,
    signal,
    providerContext
  }) {
    try {
      const { axios, cheerio, commonHeaders } = providerContext;
      const baseUrl = yield resolveBaseUrl(providerContext);
      const cleanFilter = filter || "/recently-added";
      const pageParam = page > 1 ? cleanFilter.includes("?") ? `&page=${page}` : `?page=${page}` : "";
      const url = `${baseUrl}${cleanFilter.startsWith("/") ? "" : "/"}${cleanFilter}${pageParam}`;
      const res = yield axios.get(url, {
        headers: __spreadProps(__spreadValues({}, commonHeaders || {}), {
          Referer: `${baseUrl}/`
        }),
        signal
      });
      return parseItems(res.data, cheerio, baseUrl);
    } catch (err) {
      console.error("dramacool getPosts error:", err);
      return [];
    }
  });
}, "getPosts");
var getSearchPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    page,
    signal,
    providerContext
  }) {
    try {
      const { axios, cheerio, commonHeaders } = providerContext;
      const baseUrl = yield resolveBaseUrl(providerContext);
      const pageParam = page > 1 ? `&page=${page}` : "";
      const url = `${baseUrl}/search?type=drama&keyword=${encodeURIComponent(
        searchQuery
      )}${pageParam}`;
      const res = yield axios.get(url, {
        headers: __spreadProps(__spreadValues({}, commonHeaders || {}), {
          Referer: `${baseUrl}/`
        }),
        signal
      });
      return parseItems(res.data, cheerio, baseUrl);
    } catch (err) {
      console.error("dramacool getSearchPosts error:", err);
      return [];
    }
  });
}, "getSearchPosts");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

