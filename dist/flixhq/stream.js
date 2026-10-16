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

// providers/flixhq/stream.ts
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

// providers/flixhq/stream.ts
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link: id,
    providerContext
  }) {
    var _a;
    try {
      const episodeId = id.split("*")[0];
      const mediaId = id.split("*")[1];
      const baseUrl = yield getBaseUrl("consumet");
      const serverUrl = `${baseUrl}/movies/flixhq/servers?episodeId=${episodeId}&mediaId=${mediaId}`;
      const res = yield fetch(serverUrl);
      const servers = yield res.json();
      const streamLinks = [];
      for (const server of servers) {
        const streamUrl = `${baseUrl}/movies/flixhq/watch?server=` + server.name + "&episodeId=" + episodeId + "&mediaId=" + mediaId;
        const streamRes = yield fetch(streamUrl);
        const streamData = yield streamRes.json();
        const subtitles = [];
        if (((_a = streamData == null ? void 0 : streamData.sources) == null ? void 0 : _a.length) > 0) {
          if (streamData.subtitles) {
            streamData.subtitles.forEach((sub) => {
              var _a2;
              subtitles.push({
                language: (_a2 = sub == null ? void 0 : sub.lang) == null ? void 0 : _a2.slice(0, 2),
                uri: sub == null ? void 0 : sub.url,
                type: "text/vtt",
                title: sub == null ? void 0 : sub.lang
              });
            });
          }
          streamData.sources.forEach((source) => {
            var _a2;
            streamLinks.push({
              server: (server == null ? void 0 : server.name) + "-" + ((_a2 = source == null ? void 0 : source.quality) == null ? void 0 : _a2.replace("auto", "MultiQuality")),
              link: source.url,
              type: source.isM3U8 ? "m3u8" : "mp4",
              subtitles
            });
          });
        }
      }
      return streamLinks;
    } catch (err) {
      console.error(err);
      return [];
    }
  });
}, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

