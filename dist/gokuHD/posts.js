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

// providers/gokuHD/posts.ts
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
var getBaseUrl = /* @__PURE__ */ __name((providerValue2) => __async(null, null, function* () {
  var _a, _b;
  try {
    const providerUrls = yield fetchProviderUrls();
    return (_b = (_a = providerUrls[providerValue2]) == null ? void 0 : _a.url) != null ? _b : "";
  } catch (error) {
    console.error(`Error fetching baseUrl: ${providerValue2}`, error);
    throw error;
  }
}), "getBaseUrl");

// providers/gokuHD/posts.ts
var providerValue = "gokuHD";
function normalizeLink(baseUrl, link) {
  const url = new URL(link, `${baseUrl}/`);
  return `${url.pathname}${url.search}${url.hash}`;
}
__name(normalizeLink, "normalizeLink");
function extractPosts($, baseUrl) {
  const posts = [];
  $("article").each((_, element) => {
    const card = $(element);
    const anchor = card.find("h2.entry-title a, h2 a, a[href]").first();
    const href = anchor.attr("href") || "";
    const title = card.find("h2.entry-title, h2, h3").first().text().replace(/\s+/g, " ").trim();
    const image = card.find("img").first().attr("data-lazy-src") || card.find("img").first().attr("data-src") || card.find("img").first().attr("src") || "";
    if (!href || !title) return;
    posts.push({ title, link: normalizeLink(baseUrl, href), image });
  });
  return posts;
}
__name(extractPosts, "extractPosts");
var getPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    filter,
    page,
    signal,
    providerContext
  }) {
    const { axios, cheerio, commonHeaders } = providerContext;
    const baseUrl = yield getBaseUrl(providerValue);
    const path = page > 1 ? filter ? `/${filter}/page/${page}/` : `/page/${page}/` : filter ? `/${filter}/` : `/`;
    const url = new URL(path, `${baseUrl}/`).href;
    const response = yield axios.get(url, {
      signal,
      headers: __spreadProps(__spreadValues({}, commonHeaders), {
        Referer: `${baseUrl}/`
      })
    });
    const $ = cheerio.load(response.data);
    return extractPosts($, baseUrl);
  });
}, "getPosts");
var getSearchPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    page,
    signal,
    providerContext
  }) {
    var _a, _b, _c, _d;
    if (!searchQuery.trim()) return [];
    const { axios, cheerio, commonHeaders } = providerContext;
    const baseUrl = yield getBaseUrl(providerValue);
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const apiUrl = new URL(
        "https://search.pingora.fyi/collections/post/documents/search"
      );
      apiUrl.searchParams.append("q", searchQuery.trim());
      apiUrl.searchParams.append(
        "query_by",
        "post_title,category,stars,director,imdb_id"
      );
      apiUrl.searchParams.append("query_by_weights", "4,2,2,2,4");
      apiUrl.searchParams.append("sort_by", "sort_by_date:desc");
      apiUrl.searchParams.append("limit", "18");
      apiUrl.searchParams.append("highlight_fields", "none");
      apiUrl.searchParams.append("use_cache", "true");
      apiUrl.searchParams.append("page", String(page || 1));
      apiUrl.searchParams.append("analytics_tag", today);
      const response = yield axios.get(apiUrl.href, {
        signal,
        headers: __spreadProps(__spreadValues({}, commonHeaders), {
          Referer: `${baseUrl}/search/`,
          Origin: baseUrl
        })
      });
      if ((_b = (_a = response.data) == null ? void 0 : _a.hits) == null ? void 0 : _b.length) {
        return response.data.hits.map((hit) => {
          const doc = hit.document;
          return {
            title: doc.post_title,
            link: normalizeLink(baseUrl, doc.permalink),
            image: doc.post_thumbnail || ""
          };
        });
      }
    } catch (e) {
    }
    try {
      const searchUrl = page > 1 ? new URL(`/page/${page}/`, `${baseUrl}/`).href : new URL(`/`, `${baseUrl}/`).href;
      const params = new URLSearchParams({
        s: searchQuery.trim(),
        post_type: "post"
      });
      const response = yield axios.post(searchUrl, params.toString(), {
        signal,
        headers: __spreadProps(__spreadValues({}, commonHeaders), {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: `${baseUrl}/`
        })
      });
      const $ = cheerio.load(response.data);
      return extractPosts($, baseUrl);
    } catch (error) {
      if (((_c = error == null ? void 0 : error.response) == null ? void 0 : _c.status) === 404 || ((_d = error == null ? void 0 : error.response) == null ? void 0 : _d.status) === 403) {
        return [];
      }
      throw error;
    }
  });
}, "getSearchPosts");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

