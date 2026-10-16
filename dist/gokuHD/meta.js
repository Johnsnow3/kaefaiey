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

// providers/gokuHD/meta.ts
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

// providers/gokuHD/meta.ts
var providerValue = "gokuHD";
function sourceHeading($, anchor) {
  const container = anchor.closest("center, p, div");
  let heading = container.prevAll("h4, h3, h2").first();
  if (!heading.length) heading = anchor.prevAll("h4, h3, h2").first();
  return heading.text().replace(/\s+/g, " ").trim();
}
__name(sourceHeading, "sourceHeading");
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c, _d;
    const { axios, cheerio, commonHeaders } = providerContext;
    const baseUrl = yield getBaseUrl(providerValue);
    const pageUrl = new URL(link, `${baseUrl}/`).href;
    const response = yield axios.get(pageUrl, {
      headers: __spreadProps(__spreadValues({}, commonHeaders), {
        Referer: `${baseUrl}/`
      })
    });
    const $ = cheerio.load(response.data);
    const content = $(
      "article.single-entry-body, article, .inside-article, .entry-content, .post-content"
    ).first();
    const title = $("h1").first().text().replace(/\s+/g, " ").trim();
    const pageText = content.text().replace(/\s+/g, " ");
    const type = /anime series|episodes?:|seasons?:/i.test(pageText) || /season\s*\d+/i.test(title) ? "series" : "movie";
    const image = content.find("img").first().attr("data-lazy-src") || content.find("img").first().attr("data-src") || content.find("img").first().attr("src") || "";
    const imdbId = ((_b = (_a = $('a[href*="imdb.com"]').attr("href")) == null ? void 0 : _a.match(/tt\d+/)) == null ? void 0 : _b[0]) || ((_c = content.text().match(/tt\d{7,8}/)) == null ? void 0 : _c[0]) || "";
    const rating = ((_d = pageText.match(/IMDb Rating:\s*([\d.]+)/i)) == null ? void 0 : _d[1]) || "";
    const genresMatch = pageText.match(
      /Genres?:\s*([^|\n]+?)(?:\s+Language:|\s*\||\n|$)/i
    );
    const tags = genresMatch ? genresMatch[1].split(",").map((tag) => tag.trim()).filter(Boolean) : [];
    const synopsis = content.find("p").filter((_, el) => {
      const t = $(el).text().trim();
      return t.length > 20 && !t.includes("Searching Keywords") && !t.includes("Anime Info") && !t.includes("DOWNLOAD");
    }).first().text().trim() || content.find(".post-meta + p").first().text().trim() || content.find("p").first().text().trim();
    const links = [];
    content.find("a[class*='wp-btn'], a[class*='download-btn']").each((_, element) => {
      var _a2;
      const anchor = $(element);
      const href = anchor.attr("href") || "";
      if (!href || href.startsWith("#") || href.includes("vglist") || href.includes("vegamovies") || href.includes("rogmovies") || href.includes("telegram") || href.includes("whatsapp")) {
        return;
      }
      const heading = sourceHeading($, anchor);
      const btnText = anchor.text().replace(/\s+/g, " ").trim();
      if (type === "series" && (/batch/i.test(btnText) || /batch\s*file|zip\s*file/i.test(heading))) {
        return;
      }
      const linkTitle = heading ? btnText ? `${heading} (${btnText})` : heading : btnText || `Source ${links.length + 1}`;
      const quality = ((_a2 = (heading + " " + linkTitle).match(/\d{3,4}p/i)) == null ? void 0 : _a2[0]) || "";
      links.push({
        title: linkTitle,
        quality,
        episodesLink: type === "series" ? href : void 0,
        directLinks: type === "movie" ? [{ title: linkTitle, link: href, type: "movie" }] : []
      });
    });
    return {
      title,
      image,
      synopsis,
      imdbId,
      type,
      tags,
      rating,
      linkList: links,
      webUrl: pageUrl
    };
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

