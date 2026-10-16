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

// providers/movieBoxWeb/stream.ts
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

// providers/movieBoxWeb/utils.ts
var providerValue = "movieBoxWeb";
function decodeLink(value) {
  return JSON.parse(value);
}
__name(decodeLink, "decodeLink");
function absoluteUrl(baseUrl, path) {
  return new URL(path, `${baseUrl}/`).toString();
}
__name(absoluteUrl, "absoluteUrl");

// providers/movieBoxWeb/stream.ts
var defaultUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
var requestHeaders = {
  Accept: "application/json",
  "User-Agent": defaultUserAgent,
  "x-client-info": JSON.stringify({ timezone: "Asia/Colombo" }),
  "x-source": ""
};
function getQuality(resolutions) {
  const values = (resolutions || "").split(",").map(Number).filter((value) => [360, 480, 720, 1080, 2160].includes(value));
  const quality = Math.max(...values);
  return Number.isFinite(quality) ? String(quality) : void 0;
}
__name(getQuality, "getQuality");
function getStreamType(format, url) {
  const normalized = format == null ? void 0 : format.toUpperCase();
  if (normalized === "HLS" || normalized === "M3U8") return "m3u8";
  if (normalized === "DASH" || normalized === "MPD") return "mpd";
  if (url) {
    const cleanUrl = url.split("?")[0].toLowerCase();
    if (cleanUrl.endsWith(".m3u8")) return "m3u8";
    if (cleanUrl.endsWith(".mpd")) return "mpd";
  }
  return "mp4";
}
__name(getStreamType, "getStreamType");
function mapCaptions(captions) {
  return captions.filter((caption) => Boolean(caption.url)).map((caption) => {
    var _a;
    return {
      title: caption.lanName || caption.lan || "Subtitle",
      language: caption.lan || "und",
      type: ((_a = caption.url) == null ? void 0 : _a.includes(".vtt")) ? "text/vtt" : "application/x-subrip",
      uri: caption.url || ""
    };
  });
}
__name(mapCaptions, "mapCaptions");
function getCaptions(_0, _1, _2, _3) {
  return __async(this, arguments, function* (baseUrl, playback, stream, referer, userAgent = defaultUserAgent) {
    var _a;
    try {
      if (!stream.id || !stream.format) return [];
      const params = new URLSearchParams({
        format: stream.format,
        id: stream.id,
        subjectId: playback.subjectId,
        detailPath: playback.detailPath
      });
      const url = absoluteUrl(
        baseUrl,
        `/wefeed-h5api-bff/subject/caption?${params}`
      );
      const response = yield fetch(url, {
        headers: __spreadProps(__spreadValues({}, requestHeaders), { "User-Agent": userAgent, Referer: referer })
      });
      if (!response.ok) return [];
      const data = yield response.json();
      return mapCaptions(((_a = data == null ? void 0 : data.data) == null ? void 0 : _a.captions) || []);
    } catch (e) {
      return [];
    }
  });
}
__name(getCaptions, "getCaptions");
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a;
    try {
      const playback = decodeLink(link);
      const baseUrl = yield getBaseUrl(providerValue);
      const userAgent = ((_a = providerContext == null ? void 0 : providerContext.commonHeaders) == null ? void 0 : _a["User-Agent"]) || defaultUserAgent;
      const streamHeaders = {
        Referer: `${baseUrl}/`,
        Origin: baseUrl,
        "User-Agent": userAgent
      };
      const watchParams = new URLSearchParams({
        id: playback.subjectId,
        type: "/movie/detail",
        detailSe: playback.season ? String(playback.season) : "",
        detailEp: playback.episode ? String(playback.episode) : "",
        lang: "en"
      });
      const referer = absoluteUrl(
        baseUrl,
        `/movies/${playback.detailPath}?${watchParams}`
      );
      const playParams = new URLSearchParams({
        subjectId: playback.subjectId,
        detailPath: playback.detailPath
      });
      if (playback.season && playback.episode) {
        playParams.set("se", String(playback.season));
        playParams.set("ep", String(playback.episode));
      }
      const playUrl = absoluteUrl(
        baseUrl,
        `/wefeed-h5api-bff/subject/play?${playParams}`
      );
      const response = yield fetch(playUrl, {
        headers: __spreadProps(__spreadValues({}, requestHeaders), { "User-Agent": userAgent, Referer: referer })
      });
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText} | URL ${playUrl}`
        );
      }
      const data = yield response.json();
      const playData = data == null ? void 0 : data.data;
      if ((data == null ? void 0 : data.code) !== 0) {
        throw new Error(
          (data == null ? void 0 : data.message) || `MovieBox Web play API code ${data == null ? void 0 : data.code}`
        );
      }
      if ((playData == null ? void 0 : playData.hasResource) === false) return [];
      if (!playData) throw new Error("MovieBox Web play data was not found");
      const sources = [
        ...playData.streams || [],
        ...playData.hls || [],
        ...playData.dash || []
      ];
      const availableSources = sources.filter(
        (source) => source.url && !source.vipLocked
      );
      console.log("MovieBox Web stream sources", availableSources);
      return Promise.all(
        availableSources.map((source) => __async(null, null, function* () {
          return {
            server: `${playback.language} ${source.resolutions || source.format || ""}`.trim(),
            link: source.url || "",
            type: getStreamType(source.format, source.url),
            quality: getQuality(source.resolutions),
            subtitles: yield getCaptions(
              baseUrl,
              playback,
              source,
              referer,
              userAgent
            ),
            headers: streamHeaders
          };
        }))
      );
    } catch (error) {
      throwProviderError("MovieBox Web", "stream", error);
    }
  });
}, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

