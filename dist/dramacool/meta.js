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

// providers/dramacool/meta.ts
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

// providers/dramacool/meta.ts
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
function cleanSynopsis(raw) {
  return raw.replace(/^Description:\s*/i, "").replace(/^Other name:\s*/i, "").trim();
}
__name(cleanSynopsis, "cleanSynopsis");
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    try {
      const { axios, cheerio, commonHeaders } = providerContext;
      const baseUrl = yield resolveBaseUrl(providerContext);
      let currentUrl = link.startsWith("http") ? link : `${baseUrl}${link.startsWith("/") ? "" : "/"}${link}`;
      const headers = __spreadProps(__spreadValues({}, commonHeaders || {}), {
        Referer: `${baseUrl}/`
      });
      if (!currentUrl.includes("/drama-detail/")) {
        try {
          const epRes = yield axios.get(currentUrl, { headers });
          const $ep = cheerio.load(epRes.data);
          const detailHref = $ep('.category a[href*="/drama-detail/"]').first().attr("href") || $ep('a[href*="/drama-detail/"]').first().attr("href");
          if (detailHref) {
            currentUrl = detailHref.startsWith("http") ? detailHref : `${baseUrl}${detailHref.startsWith("/") ? "" : "/"}${detailHref}`;
          }
        } catch (e) {
          console.warn("Failed to resolve detail link from episode page:", e);
        }
      }
      const res = yield axios.get(currentUrl, { headers });
      const $ = cheerio.load(res.data);
      const title = $("h1").first().text().trim();
      const rawImage = $(".img img, .info .img img, .drama-detail .img img").first().attr("src") || $(".img img").first().attr("data-original") || "";
      const image = rawImage.startsWith("http") ? rawImage : rawImage ? `${baseUrl}${rawImage.startsWith("/") ? "" : "/"}${rawImage}` : "";
      let synopsis = "";
      $(".info p, .content p, .details p").each((_, p) => {
        const text = $(p).text().trim();
        if (text.toLowerCase().includes("description:") || !synopsis && text.length > 50 && !text.includes("Country:")) {
          synopsis = cleanSynopsis(text);
        }
      });
      const tags = [];
      $(".other-info p, .info p").each((_, p) => {
        const text = $(p).text().trim();
        if (text.startsWith("Country:")) {
          tags.push(text.replace("Country:", "").trim());
        } else if (text.startsWith("Status:")) {
          tags.push(text.replace("Status:", "").trim());
        } else if (text.startsWith("Released:")) {
          tags.push(text.replace("Released:", "").trim());
        } else if (text.startsWith("Genre:")) {
          const genreList = text.replace("Genre:", "").split(",").map((g) => g.trim()).filter(Boolean);
          tags.push(...genreList);
        }
      });
      const isMovie = currentUrl.includes("/drama-movie") || tags.some((t) => t.toLowerCase() === "movie");
      const mediaType = isMovie ? "movie" : "series";
      const subLinks = [];
      const episodeElements = [];
      $("ul.all-episode li").each((_, el) => {
        var _a;
        const a = $(el).find("a").first();
        const href = a.attr("href") || "";
        const epTitle = $(el).find("h3, .title").text().trim() || ((_a = a.attr("title")) == null ? void 0 : _a.trim()) || "";
        const epType = $(el).find(".type").first().text().trim();
        if (href) {
          episodeElements.push({ href, title: epTitle, type: epType });
        }
      });
      episodeElements.reverse();
      episodeElements.forEach((ep, index) => {
        const epUrl = ep.href.startsWith("http") ? ep.href : `${baseUrl}${ep.href.startsWith("/") ? "" : "/"}${ep.href}`;
        let displayTitle = isMovie ? "Full Movie" : `Episode ${index + 1}`;
        const epNumMatch = ep.title.match(/episode\s*([0-9.]+)/i);
        if (epNumMatch && !isMovie) {
          displayTitle = `Episode ${epNumMatch[1]}`;
        }
        if (ep.type && ep.type !== "SUB") {
          displayTitle += ` (${ep.type})`;
        }
        subLinks.push({
          title: displayTitle,
          link: epUrl,
          type: mediaType
        });
      });
      const linkList = [
        {
          title: isMovie ? "Movie" : title || "Episodes",
          directLinks: subLinks
        }
      ];
      return {
        title: title || "Drama",
        synopsis,
        image,
        imdbId: "",
        type: mediaType,
        tags: tags.filter(Boolean),
        linkList
      };
    } catch (err) {
      console.error("dramacool getMeta error:", err);
      return {
        title: "",
        synopsis: "",
        image: "",
        imdbId: "",
        type: "series",
        linkList: []
      };
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

