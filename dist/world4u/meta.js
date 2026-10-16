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

// providers/world4u/meta.ts
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

// providers/world4u/meta.ts
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a;
    try {
      const { axios, cheerio } = providerContext;
      const baseUrl = yield getBaseUrl("w4u");
      const url = new URL(link, `${baseUrl}/`).href;
      const res = yield axios.get(url);
      const data = res.data;
      const $ = cheerio.load(data);
      const pageTitle = $("h1, .entry-title, title").first().text().replace("Download", "").trim();
      const pageBody = $("body").text();
      const isSeries = (/season\s*\d+/i.test(pageTitle) || /\[\s*s\d{1,2}\s*\]/i.test(pageTitle) || /(?:web\s*series|tv\s*series|series)/i.test(pageTitle) || /\[\s*s\d{1,2}\s*e\d{1,2}\s*\]/i.test(pageTitle) || /\[\s*e\d{1,2}\s*added\s*\]/i.test(pageTitle)) && !pageTitle.toLowerCase().includes("full movie");
      const type = isSeries ? "series" : "movie";
      const imdbId = ((_a = $(".imdb_left").find("a").attr("href")) == null ? void 0 : _a.split("/")[4]) || "";
      let title = $(".entry-content").find('strong:contains("Name")').first().children().remove().end().text().replace(":", "").replace(/\[.*?\]|\(.*?\)|\|.*/g, "").trim();
      if (!title) {
        title = pageTitle.replace(/\[.*?\]|\(.*?\)|\|.*/g, "").trim();
      }
      const synopsis = $(".entry-content").find('p:contains("Synopsis"),p:contains("Plot"),p:contains("Story")').first().children().remove().end().text().trim() || "";
      const image = $(".wp-caption").find("img").attr("data-src") || $(".entry-content").find("img").attr("data-src") || $(".entry-content").find("img").attr("src") || "";
      const links = [];
      $(".my-button").map((i, element) => {
        var _a2;
        let linkTitle = $(element).parent().parent().prev().text().trim().replace(/[\r\n\t]+/g, " ");
        const episodesLink = $(element).attr("href");
        const quality = ((_a2 = linkTitle.match(/\b(480p|720p|1080p|2160p)\b/i)) == null ? void 0 : _a2[0]) || "";
        if (episodesLink && linkTitle) {
          links.push({
            title: linkTitle,
            episodesLink: type === "series" ? episodesLink : "",
            directLinks: type === "movie" ? [
              {
                link: episodesLink,
                title: linkTitle,
                type: "movie"
              }
            ] : [],
            quality
          });
        }
      });
      return {
        title,
        synopsis,
        image,
        imdbId,
        type,
        linkList: links,
        webUrl: url
      };
    } catch (err) {
      throwProviderError("World4u", "metadata", err);
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

