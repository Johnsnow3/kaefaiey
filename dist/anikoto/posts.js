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

// providers/anikoto/posts.ts
var posts_exports = {};
__export(posts_exports, {
  getPosts: () => getPosts,
  getSearchPosts: () => getSearchPosts
});

var BASE_URL = "https://anikototv.to";
var getPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    filter,
    page,
    signal,
    providerContext
  }) {
    try {
      const { axios, cheerio } = providerContext;
      const delimiter = filter.includes("?") ? "&" : "?";
      const url = `${BASE_URL}${filter}${delimiter}page=${page}`;
      const res = yield axios.get(url, {
        headers: __spreadProps(__spreadValues({}, providerContext.commonHeaders), {
          Referer: `${BASE_URL}/`
        }),
        signal
      });
      const $ = cheerio.load(res.data);
      const posts = [];
      $(".ani.items .item, .items .item, div.item").each((_, el) => {
        const title = $(el).find(".info a.name, .info a.d-title, a.name.d-title").first().text().trim() || $(el).find(".info a.name, a.name.d-title").first().attr("data-jp") || $(el).find("img").attr("alt") || "";
        const linkEl = $(el).find(".info a.name, .info a.d-title, .poster a, a[href*='/watch/']").first();
        let href = linkEl.attr("href") || "";
        if (!href) return;
        if (!href.startsWith("http")) {
          href = `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
        }
        const image = $(el).find("img").attr("src") || "";
        if (title && href) {
          posts.push({
            title,
            link: href,
            image
          });
        }
      });
      return posts;
    } catch (err) {
      console.error("Anikoto getPosts error:", err);
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
      const { axios, cheerio } = providerContext;
      const url = `${BASE_URL}/filter?keyword=${encodeURIComponent(
        searchQuery
      )}&page=${page}`;
      const res = yield axios.get(url, {
        headers: __spreadProps(__spreadValues({}, providerContext.commonHeaders), {
          Referer: `${BASE_URL}/`
        }),
        signal
      });
      const $ = cheerio.load(res.data);
      const posts = [];
      $(".ani.items .item, .items .item, div.item").each((_, el) => {
        const title = $(el).find(".info a.name, .info a.d-title, a.name.d-title").first().text().trim() || $(el).find(".info a.name, a.name.d-title").first().attr("data-jp") || $(el).find("img").attr("alt") || "";
        const linkEl = $(el).find(".info a.name, .info a.d-title, .poster a, a[href*='/watch/']").first();
        let href = linkEl.attr("href") || "";
        if (!href) return;
        if (!href.startsWith("http")) {
          href = `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
        }
        const image = $(el).find("img").attr("src") || "";
        if (title && href) {
          posts.push({
            title,
            link: href,
            image
          });
        }
      });
      return posts;
    } catch (err) {
      console.error("Anikoto getSearchPosts error:", err);
      return [];
    }
  });
}, "getSearchPosts");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

