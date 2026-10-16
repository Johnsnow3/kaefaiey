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

// providers/primewire/stream.ts
var stream_exports = {};
__export(stream_exports, {
  getStream: () => getStream
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

// providers/primewire/stream.ts
function getStreamTapeUrl(html, iframeUrl) {
  const match = html.match(
    /document\.getElementById\(['"]robotlink['"]\)\.innerHTML\s*=\s*['"]([^'"]+)['"]/
  );
  if (!(match == null ? void 0 : match[1])) return "";
  const link = match[1].replace(/&amp;/g, "&").replace(/\\\//g, "/");
  return new URL(link.startsWith("//") ? `https:${link}` : link, iframeUrl).href;
}
__name(getStreamTapeUrl, "getStreamTapeUrl");
function getEmbeddedLink(data) {
  if (typeof data === "object" && data && "link" in data) {
    const link = data.link;
    return typeof link === "string" ? link : "";
  }
  if (typeof data !== "string") return "";
  try {
    return getEmbeddedLink(JSON.parse(data));
  } catch (e) {
    return "";
  }
}
__name(getEmbeddedLink, "getEmbeddedLink");
function getEmbeddedLinkWithWaf(source, pageUrl, providerContext) {
  return __async(this, null, function* () {
    var _a;
    const { axios, commonHeaders, openWebView } = providerContext;
    const url = `${new URL(pageUrl).origin}/links/go/${source.id}?embed=true`;
    const headers = __spreadProps(__spreadValues({}, commonHeaders), { Referer: pageUrl });
    try {
      return getEmbeddedLink((yield axios.get(url, { headers })).data);
    } catch (error) {
      if (((_a = error.response) == null ? void 0 : _a.status) !== 403 || !openWebView) throw error;
      const wafResult = yield openWebView(url, {
        title: "Solve the captcha below and click done",
        description: "Required to open PrimeWire streaming links.",
        headers,
        waitForCookie: "cf_clearance",
        force: true
      });
      const embeddedLink = getEmbeddedLink(wafResult.data);
      if (embeddedLink) return embeddedLink;
      return getEmbeddedLink(
        (yield axios.get(url, {
          headers: __spreadProps(__spreadValues({}, headers), {
            "User-Agent": wafResult.userAgent || headers["User-Agent"],
            Cookie: wafResult.cookies
          })
        })).data
      );
    }
  });
}
__name(getEmbeddedLinkWithWaf, "getEmbeddedLinkWithWaf");
function getSources(data, providerContext) {
  const $ = providerContext.cheerio.load(data);
  const sources = [];
  $("table.movie_version").each((_, element) => {
    const row = $(element);
    const host = row.find(".version-host").text().trim().toLowerCase();
    const id = row.find(".wp-menu-btn").attr("data-wp-menu");
    const size = row.find(".quality_tag").text().trim();
    if (host.includes("streamtape") && id) sources.push({ id, size });
  });
  return sources;
}
__name(getSources, "getSources");
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    type,
    providerContext
  }) {
    const { axios, commonHeaders } = providerContext;
    try {
      const baseUrl = yield getBaseUrl("primewire");
      const pageUrl = new URL(link, `${baseUrl}/`).href;
      console.log("pwGetStream", type, pageUrl);
      const page = yield axios.get(pageUrl, { headers: commonHeaders });
      const streams = [];
      for (const source of getSources(page.data, providerContext)) {
        try {
          const iframeUrl = yield getEmbeddedLinkWithWaf(
            source,
            pageUrl,
            providerContext
          );
          if (!iframeUrl) continue;
          const iframe = yield axios.get(iframeUrl, {
            headers: __spreadProps(__spreadValues({}, commonHeaders), { Referer: pageUrl })
          });
          const streamUrl = getStreamTapeUrl(iframe.data, iframeUrl);
          if (!streamUrl) continue;
          streams.push({
            server: `StreamTape ${source.size}`.trim(),
            link: streamUrl,
            type: "mp4",
            headers: { Referer: iframeUrl }
          });
        } catch (error) {
          console.log(`PrimeWire StreamTape source ${source.id} failed`, error);
        }
      }
      return streams;
    } catch (error) {
      throwProviderError("PrimeWire", "stream", error);
    }
  });
}, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

