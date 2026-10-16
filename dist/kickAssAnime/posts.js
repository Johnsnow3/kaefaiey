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

// providers/kickAssAnime/posts.ts
var posts_exports = {};
__export(posts_exports, {
  getPosts: () => getPosts,
  getSearchPosts: () => getSearchPosts
});

var BASE_URL = "https://kaa.lt";
var headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*"
};
function formatPoster(poster) {
  if (!poster) return "";
  if (poster.hq) return `${BASE_URL}/image/poster/${poster.hq}.webp`;
  if (poster.sm) return `${BASE_URL}/image/poster/${poster.sm}.webp`;
  if (poster.url) return poster.url.startsWith("http") ? poster.url : `${BASE_URL}/${poster.url}`;
  return "";
}
__name(formatPoster, "formatPoster");
var getPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    filter,
    page = 1,
    providerContext
  }) {
    var _a;
    const { axios } = providerContext;
    let url = `${BASE_URL}${filter}`;
    if (filter.includes("/api/show/trending")) {
      url = `${BASE_URL}/api/show/trending?page=${page}`;
    } else if (filter.includes("/api/show/popular")) {
      url = `${BASE_URL}/api/show/popular?page=${page}`;
    } else if (filter.includes("/api/show/recent")) {
      const typeMatch = filter.match(/type=([a-z]+)/);
      const type = typeMatch ? typeMatch[1] : "all";
      url = `${BASE_URL}/api/show/recent?type=${type}&page=${page}`;
    } else if (filter.startsWith("/api/anime")) {
      url = `${BASE_URL}/api/anime?page=${page}`;
    } else {
      const encoded = btoa(JSON.stringify({ genres: [filter] }));
      url = `${BASE_URL}/api/anime?page=${page}&filters=${encoded}`;
    }
    const res = yield axios.get(url, { headers });
    const list = ((_a = res.data) == null ? void 0 : _a.result) || [];
    return list.map((item) => ({
      title: item.title_en || item.title || "",
      link: `${BASE_URL}/${item.slug}`,
      image: formatPoster(item.poster)
    }));
  });
}, "getPosts");
var getSearchPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    page = 1,
    providerContext
  }) {
    var _a;
    const { axios } = providerContext;
    const res = yield axios.post(
      `${BASE_URL}/api/fsearch`,
      {
        page,
        query: searchQuery
      },
      {
        headers: __spreadProps(__spreadValues({}, headers), {
          "Content-Type": "application/json",
          Referer: `${BASE_URL}/search?q=${encodeURIComponent(searchQuery)}`
        })
      }
    );
    const list = ((_a = res.data) == null ? void 0 : _a.result) || [];
    return list.map((item) => ({
      title: item.title_en || item.title || "",
      link: `${BASE_URL}/${item.slug}`,
      image: formatPoster(item.poster)
    }));
  });
}, "getSearchPosts");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

