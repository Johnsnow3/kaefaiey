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

// providers/movielinkdb/posts.ts
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

// providers/movielinkdb/posts.ts
var defaultHeaders = {
  Referer: "https://www.google.com",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Pragma: "no-cache",
  "Cache-Control": "no-cache"
};
function getPosts(_0) {
  return __async(this, arguments, function* ({
    filter,
    page = 1,
    signal,
    providerContext
  }) {
    return fetchPosts({ filter, page, query: "", signal, providerContext });
  });
}
__name(getPosts, "getPosts");
function getSearchPosts(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    page = 1,
    signal,
    providerContext
  }) {
    return fetchPosts({
      filter: "",
      page,
      query: searchQuery,
      signal,
      providerContext
    });
  });
}
__name(getSearchPosts, "getSearchPosts");
function fetchPosts(_0) {
  return __async(this, arguments, function* ({
    filter,
    query,
    page = 1,
    signal,
    providerContext
  }) {
    try {
      const baseUrl = ((yield getBaseUrl("movielinkbd").catch(() => "")) || (yield getBaseUrl("movielinkdb").catch(() => "")) || "https://ex5wfv.movielinkbd.li").replace(/\/+$/, "");
      let url;
      if (query && query.trim()) {
        url = `${baseUrl}/search?q=${encodeURIComponent(query)}${page > 1 ? `&paged=${page}` : ""}`;
      } else if (filter) {
        url = filter.startsWith("/") ? `${baseUrl}${filter.replace(/\/$/, "")}${page > 1 ? `/page/${page}` : ""}` : `${baseUrl}/${filter}${page > 1 ? `/page/${page}` : ""}`;
      } else {
        url = `${baseUrl}${page > 1 ? `/page/${page}` : ""}`;
      }
      const { axios, cheerio } = providerContext;
      const res = yield axios.get(url, { headers: defaultHeaders, signal });
      const $ = cheerio.load(res.data || "");
      const seen = /* @__PURE__ */ new Set();
      const catalog = [];
      const MAX_POSTS = page === 1 ? 20 : 100;
      $(".movie-card, .ml-card").each((_, el) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
        if (catalog.length >= MAX_POSTS) return false;
        const card = $(el);
        let rawLink = ((_a = card.find("a.title[href]").first().attr("href")) == null ? void 0 : _a.trim()) || ((_b = card.find("a.ml-poster[href]").first().attr("href")) == null ? void 0 : _b.trim()) || ((_c = card.find("a.ml-ct[href]").first().attr("href")) == null ? void 0 : _c.trim()) || ((_d = card.find('a[data-mlbd-click-ad="movie-card"][href]').first().attr("href")) == null ? void 0 : _d.trim()) || ((_e = card.find("a[href]").first().attr("href")) == null ? void 0 : _e.trim());
        if (!rawLink) return;
        let fullLink;
        try {
          fullLink = new URL(rawLink, baseUrl).href;
        } catch (e) {
          fullLink = rawLink.startsWith("http") ? rawLink : `${baseUrl}${rawLink.startsWith("/") ? "" : "/"}${rawLink}`;
        }
        if (seen.has(fullLink)) return;
        const title = card.find(".title").first().text().trim() || card.find(".ml-ct").first().text().trim() || ((_f = card.find("a.ml-poster").attr("title")) == null ? void 0 : _f.trim()) || ((_g = card.find("img").attr("alt")) == null ? void 0 : _g.trim()) || ((_h = card.find("a[title]").attr("title")) == null ? void 0 : _h.trim()) || "Untitled";
        const image = ((_i = card.find("img").attr("data-src")) == null ? void 0 : _i.trim()) || ((_j = card.find("img").attr("src")) == null ? void 0 : _j.trim()) || "";
        seen.add(fullLink);
        catalog.push({ title, link: fullLink, image });
      });
      return catalog;
    } catch (err) {
      console.error(
        "Movielinkdb fetchPosts error:",
        err instanceof Error ? err.message : String(err)
      );
      return [];
    }
  });
}
__name(fetchPosts, "fetchPosts");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

