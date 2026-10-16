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

// providers/mkvDrama/posts.ts
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

// providers/mkvDrama/request.ts
var providerValue = "mkvDrama";
var mkvDramaHeaders = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "max-age=0",
  Priority: "u=0, i",
  "Sec-CH-UA": '"Not;A=Brand";v="8", "Chromium";v="150", "Brave";v="150"',
  "Sec-CH-UA-Arch": '"x86"',
  "Sec-CH-UA-Bitness": '"64"',
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Model": '""',
  "Sec-CH-UA-Platform": '"Windows"',
  "Sec-CH-UA-Platform-Version": '"19.0.0"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-User": "?1",
  "Sec-GPC": "1",
  "Upgrade-Insecure-Requests": "1",
  cookie: "ext_name=ojplmecpdpgccookcobabopnaifgidhf; _did=L-1Od04LpLDvj-KnwUZUCQ; LkpgcDuljxiVttMcsesion=eyJmZV9jc3JmX3Rva2VuIjogInpQZGROclRDenZqcXE4V1UzcEhGaUhkTkEwRG1tUE1ndDQ1SktEZHc3emMiLCAiZmVfY3NyZl90b2tlbl9jcmVhdGVkX2F0IjogIjIwMjYtMDctMjVUMDg6MjQ6MjMuNDI4ODcxKzAwOjAwIn0=.amRytw.EU34Y5Oet2q7RoiPiLmITOgD2lM; cf_clearance=w5GY0s9FeC3XEEvbulOW4KEhXq_S5Gf3tAy9Ld.hUrE-1784969771-1.2.1.1-8k59IPqk0ZcVP5GGxMMnD8VmX2.iasFQtuGTnUN57_tmdEHkdSzNjkcwTO5VajEgGTS6U4vHH2E0JXtZYnPFBPJGexxW4A6TdI2pIgpu_xmQ7b.ljrp8gv_bzti5ivuya3uM6ZH8t1TS5s8VYbZBKNSkZIilQLW7.36rnbc7BtBGV1FJibBQPe9U.7.St7Z5AIsCJTtGhrep8XukM_AET3dy4GyWSNk1fZMtF6rWzg0mKLl8khIL4eDXHaXbKhlmkCZtUry1DTyhCIs3P3LkzIU4DlEejA7qhYi8iehi0MaSlZwWjwbLwLgw2OMmmssShMy6Gr5aWcZnDsCPindcbOEx53ZlsZLTLmm_NTkcOQx6sByo84V4OH9ySfRC2fPpWBP3_iiIfV2Rwt4d8a.qkn54YeVGUMTxqDRLZtBi_uvWjtnditxtUv2cKREuggUztX0Yeq04mrcM0iL1fy5c5g",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
};
function mergeMkvDramaCookies(current, setCookie) {
  const cookies = /* @__PURE__ */ new Map();
  current.split(";").map((part) => part.trim()).filter(Boolean).forEach((part) => cookies.set(part.split("=", 1)[0], part));
  const values = Array.isArray(setCookie) ? setCookie : [setCookie];
  values.filter(Boolean).forEach((value) => {
    const cookie = String(value).split(";", 1)[0];
    cookies.set(cookie.split("=", 1)[0], cookie);
  });
  return [...cookies.values()].join("; ");
}
__name(mergeMkvDramaCookies, "mergeMkvDramaCookies");
function getMkvDramaUrl(path) {
  return __async(this, null, function* () {
    const baseUrl = yield getBaseUrl(providerValue);
    const url = new URL(path, `${baseUrl}/`);
    if (url.hostname !== new URL(baseUrl).hostname) {
      throw new Error(`Refusing non-MKVDrama WAF request: ${url.hostname}`);
    }
    return url.href;
  });
}
__name(getMkvDramaUrl, "getMkvDramaUrl");
function getMkvDramaPage(path, providerContext) {
  return __async(this, null, function* () {
    var _a, _b;
    const url = yield getMkvDramaUrl(path);
    const baseUrl = new URL(url).origin;
    const headers = __spreadProps(__spreadValues({}, mkvDramaHeaders), {
      Referer: baseUrl
    });
    let forbiddenError;
    try {
      const response = yield providerContext.axios.get(url, { headers });
      return {
        data: response.data || "",
        url,
        cookies: mergeMkvDramaCookies(
          mkvDramaHeaders.cookie || "",
          (_a = response.headers) == null ? void 0 : _a["set-cookie"]
        )
      };
    } catch (error) {
      if (((_b = error.response) == null ? void 0 : _b.status) !== 403) throw error;
      forbiddenError = error;
    }
    if (typeof providerContext.openWebView !== "function") throw forbiddenError;
    const wafResult = yield providerContext.openWebView(url, {
      title: "Open MKVDrama",
      description: "Complete the security check, wait for download links to load, then click done.",
      headers,
      waitForCookie: "cf_clearance",
      force: true,
      timeoutMs: 12e4
    });
    return {
      data: wafResult.data || "",
      url: wafResult.url || url,
      cookies: wafResult.cookies,
      userAgent: wafResult.userAgent
    };
  });
}
__name(getMkvDramaPage, "getMkvDramaPage");
function toProviderPath(link, baseUrl) {
  const url = new URL(link, `${baseUrl}/`);
  return `${url.pathname}${url.search}${url.hash}`;
}
__name(toProviderPath, "toProviderPath");

// providers/mkvDrama/posts.ts
function addPage(path, page) {
  const url = new URL(path, "https://mkvdrama.net/");
  if (page > 1) url.searchParams.set("page", String(page));
  return `${url.pathname}${url.search}`;
}
__name(addPage, "addPage");
function parsePosts(path, providerContext) {
  return __async(this, null, function* () {
    const baseUrl = yield getMkvDramaUrl("/");
    const response = yield getMkvDramaPage(path, providerContext);
    const $ = providerContext.cheerio.load(response.data);
    const posts = [];
    const seen = /* @__PURE__ */ new Set();
    $("article.bs").each((_, element) => {
      const card = $(element);
      const anchor = card.find("h2 a, h3 a, a[href]").first();
      const href = anchor.attr("href") || "";
      const title = card.find("h2, h3, .title").first().text().replace(/\s+/g, " ").trim();
      const image = card.find("img").first().attr("data-src") || card.find("img").first().attr("src") || "";
      if (!href || !title || !image) return;
      const link = toProviderPath(href, baseUrl);
      if (seen.has(link)) return;
      seen.add(link);
      posts.push({ title, link, image: new URL(image, baseUrl).href });
    });
    return posts;
  });
}
__name(parsePosts, "parsePosts");
function getPosts(_0) {
  return __async(this, arguments, function* ({
    filter,
    page,
    providerContext
  }) {
    return parsePosts(addPage(filter || "/", page), providerContext);
  });
}
__name(getPosts, "getPosts");
function getSearchPosts(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    page,
    providerContext
  }) {
    if (!searchQuery.trim()) return [];
    const params = new URLSearchParams({ q: searchQuery.trim() });
    if (page > 1) params.set("page", String(page));
    return parsePosts(`/search?${params}`, providerContext);
  });
}
__name(getSearchPosts, "getSearchPosts");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

