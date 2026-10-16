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

// providers/dooflix/posts.ts
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

// providers/dooflix/posts.ts
var headers = {
  "Accept-Encoding": "gzip",
  "API-KEY": "2pm95lc6prpdbk0ppji9rsqo",
  Connection: "Keep-Alive",
  "If-Modified-Since": "Wed, 14 Aug 2024 13:00:04 GMT",
  "User-Agent": "okhttp/3.14.9"
};
var getPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    filter,
    page,
    signal,
    providerContext
  }) {
    try {
      const { axios } = providerContext;
      const baseUrl = yield getBaseUrl("dooflix");
      const catalog = [];
      const url = `${baseUrl + filter + `?page=${page}`}`;
      const res = yield axios.get(url, { headers, signal });
      const resData = res.data;
      if (!resData || typeof resData !== "string") {
        console.warn("Unexpected response format from dooflix API");
        return [];
      }
      let data;
      try {
        const jsonStart = resData.indexOf("[");
        const jsonEnd = resData.lastIndexOf("]") + 1;
        if (jsonStart === -1 || jsonEnd <= jsonStart) {
          data = JSON.parse(resData);
        } else {
          const jsonSubstring = resData.substring(jsonStart, jsonEnd);
          const parsedArray = JSON.parse(jsonSubstring);
          data = parsedArray.length > 0 ? parsedArray : resData;
        }
      } catch (parseError) {
        console.error("Error parsing dooflix response:", parseError);
        return [];
      }
      if (!Array.isArray(data)) {
        console.warn("Unexpected data format from dooflix API");
        return [];
      }
      data.forEach((result) => {
        const id = result == null ? void 0 : result.videos_id;
        if (!id) return;
        const type = !(result == null ? void 0 : result.is_tvseries) ? "tvseries" : "movie";
        const link = `${baseUrl}/rest-api//v130/single_details?type=${type}&id=${id}`;
        const thumbnailUrl = result == null ? void 0 : result.thumbnail_url;
        const image = (thumbnailUrl == null ? void 0 : thumbnailUrl.includes("https")) ? thumbnailUrl : thumbnailUrl == null ? void 0 : thumbnailUrl.replace("http", "https");
        catalog.push({
          title: (result == null ? void 0 : result.title) || "",
          link,
          image
        });
      });
      return catalog;
    } catch (err) {
      console.error("dooflix error:", err);
      return [];
    }
  });
}, "getPosts");
var getSearchPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    page,
    providerContext,
    signal
  }) {
    var _a, _b;
    try {
      if (page > 1) {
        return [];
      }
      const { axios } = providerContext;
      const catalog = [];
      const baseUrl = yield getBaseUrl("dooflix");
      const url = `${baseUrl}/rest-api//v130/search?q=${searchQuery}&type=movietvserieslive&range_to=0&range_from=0&tv_category_id=0&genre_id=0&country_id=0`;
      const res = yield axios.get(url, { headers, signal });
      const resData = res.data;
      if (!resData || typeof resData !== "string") {
        console.warn("Unexpected search response format from dooflix API");
        return [];
      }
      let data;
      try {
        const jsonStart = resData.indexOf("{");
        const jsonEnd = resData.lastIndexOf("}") + 1;
        if (jsonStart === -1 || jsonEnd <= jsonStart) {
          data = resData;
        } else {
          const jsonSubstring = resData.substring(jsonStart, jsonEnd);
          const parsedData = JSON.parse(jsonSubstring);
          data = (parsedData == null ? void 0 : parsedData.movie) ? parsedData : resData;
        }
      } catch (parseError) {
        console.error("Error parsing dooflix search response:", parseError);
        return [];
      }
      (_a = data == null ? void 0 : data.movie) == null ? void 0 : _a.forEach((result) => {
        const id = result == null ? void 0 : result.videos_id;
        if (!id) return;
        const link = `${baseUrl}/rest-api//v130/single_details?type=movie&id=${id}`;
        const thumbnailUrl = result == null ? void 0 : result.thumbnail_url;
        const image = (thumbnailUrl == null ? void 0 : thumbnailUrl.includes("https")) ? thumbnailUrl : thumbnailUrl == null ? void 0 : thumbnailUrl.replace("http", "https");
        catalog.push({
          title: (result == null ? void 0 : result.title) || "",
          link,
          image
        });
      });
      (_b = data == null ? void 0 : data.tvseries) == null ? void 0 : _b.forEach((result) => {
        const id = result == null ? void 0 : result.videos_id;
        if (!id) return;
        const link = `${baseUrl}/rest-api//v130/single_details?type=tvseries&id=${id}`;
        const thumbnailUrl = result == null ? void 0 : result.thumbnail_url;
        const image = (thumbnailUrl == null ? void 0 : thumbnailUrl.includes("https")) ? thumbnailUrl : thumbnailUrl == null ? void 0 : thumbnailUrl.replace("http", "https");
        catalog.push({
          title: (result == null ? void 0 : result.title) || "",
          link,
          image
        });
      });
      return catalog;
    } catch (error) {
      console.error("dooflix search error:", error);
      return [];
    }
  });
}, "getSearchPosts");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

