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

// providers/uhd/meta.ts
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

// providers/uhd/meta.ts
function getWithWAF(url, axios, openWebView, headers) {
  return __async(this, null, function* () {
    var _a;
    const baseUrl = url.split("/").slice(0, 3).join("/");
    try {
      return yield axios.get(url, { headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl }) });
    } catch (error) {
      if (((_a = error.response) == null ? void 0 : _a.status) === 403 && openWebView) {
        console.log(`WAF detected (403) for ${url}, using solver...`);
        const wafResult = yield openWebView(baseUrl, {
          title: "Solve the captcha below and click done",
          description: "Required to bypass anti-bot protection.",
          headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl }),
          waitForCookie: "cf_clearance",
          force: true
        });
        return yield axios.get(url, {
          headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl, Cookie: wafResult.cookie })
        });
      }
      throw error;
    }
  });
}
__name(getWithWAF, "getWithWAF");
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    try {
      const { axios, cheerio, openWebView, commonHeaders } = providerContext;
      const baseUrl = yield getBaseUrl("UhdMovies");
      const url = new URL(link, `${baseUrl}/`).href;
      const res = yield getWithWAF(url, axios, openWebView, commonHeaders);
      const html = yield res.data;
      const $ = cheerio.load(html);
      const rawTitle = $("h2:first").text() || $("h1.entry-title").text() || $("title").text().split("-")[0].trim() || "";
      const image = $("h2").siblings().find("img").attr("src") || $(".entry-content img").first().attr("src") || "";
      const episodes = [];
      const isJunkText = /* @__PURE__ */ __name((t) => {
        const lower = t.toLowerCase().trim();
        return !lower || lower === "\xA0" || lower.includes("here you can download") || lower.includes("we do not host") || lower.includes("join telegram");
      }, "isJunkText");
      const isJunkLink = /* @__PURE__ */ __name((title, link2) => {
        const lower = title.toLowerCase().trim();
        if (lower.includes("zip")) return true;
        if (lower === "3d movies" || lower === "4k hdr" || lower === "4k 2160p" || lower === "1080p x264 uhd" || lower === "1080p 60fps" || lower === "1080p x265 10bit") {
          return true;
        }
        return false;
      }, "isJunkLink");
      $(".mks_separator, p:contains('mks_separator')").each((_, element) => {
        $(element).nextUntil(".mks_separator").each((_2, el) => {
          const sectionTitle = $(el).text().replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
          if (isJunkText(sectionTitle)) return;
          const episodesList = [];
          $(el).next("p").find("a").each((_3, a) => {
            const aTitle = $(a).text().replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
            const aLink = $(a).attr("href");
            if (aTitle && aLink && !isJunkLink(aTitle, aLink)) {
              episodesList.push({ title: aTitle, link: aLink });
            }
          });
          if (sectionTitle && episodesList.length > 0) {
            episodes.push({
              title: sectionTitle,
              directLinks: episodesList
            });
          }
        });
      });
      if (episodes.length === 0) {
        $("hr").each((_, element) => {
          $(element).nextUntil("hr").each((_2, el) => {
            const sectionTitle = $(el).text().replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
            if (isJunkText(sectionTitle)) return;
            const episodesList = [];
            $(el).next("p").find("a").each((_3, a) => {
              const aTitle = $(a).text().replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
              const aLink = $(a).attr("href");
              if (aTitle && aLink && !isJunkLink(aTitle, aLink)) {
                episodesList.push({ title: aTitle, link: aLink });
              }
            });
            if (sectionTitle && episodesList.length > 0) {
              episodes.push({
                title: sectionTitle,
                directLinks: episodesList
              });
            }
          });
        });
      }
      const cleanTitle = rawTitle.replace(/^Download\s+/i, "").replace(/\s+Esubs.*$/i, "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
      const isSeries = rawTitle.toLowerCase().includes("season") || rawTitle.toLowerCase().includes("series") || episodes.some(
        (e) => {
          var _a;
          return (_a = e.directLinks) == null ? void 0 : _a.some(
            (d) => d.title.toLowerCase().includes("episode") || d.title.toLowerCase().includes("ep ") || /e\d+/i.test(d.title)
          );
        }
      );
      return {
        title: cleanTitle || rawTitle,
        image,
        imdbId: "",
        synopsis: cleanTitle || rawTitle,
        type: isSeries ? "series" : "movie",
        linkList: episodes,
        webUrl: url
      };
    } catch (error) {
      throwProviderError("UHDMovies", "metadata", error);
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

