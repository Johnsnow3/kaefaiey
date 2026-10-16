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

// providers/ridoMovies/meta.ts
var meta_exports = {};
__export(meta_exports, {
  getMeta: () => getMeta
});


// providers/getCinemetaMeta.ts
function formatEpisodeTitle(episode, name) {
  const epNum = Number(episode);
  if (!name || !name.trim()) {
    return `Episode ${episode}`;
  }
  let cleanName = name.trim();
  cleanName = cleanName.replace(/^(?:s\d+\s*e\d+|\d+x\d+)\s*[:.-]\s*/i, "");
  cleanName = cleanName.replace(
    new RegExp(`^episodes?\\s*0*${epNum}\\s*[:.-]\\s*`, "i"),
    ""
  );
  if (new RegExp(`^0*${epNum}\\s*\\.\\s*`, "i").test(cleanName)) {
    return cleanName;
  }
  if (new RegExp(`^0*${epNum}\\s*[:.-]\\s*`, "i").test(cleanName)) {
    return `${epNum}. ${cleanName.replace(new RegExp(`^0*${epNum}\\s*[:.-]\\s*`, "i"), "")}`;
  }
  if (new RegExp(`^episodes?\\s*0*${epNum}$`, "i").test(cleanName)) {
    return `Episode ${epNum}`;
  }
  return `${epNum}. ${cleanName}`;
}
__name(formatEpisodeTitle, "formatEpisodeTitle");

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

// providers/ridoMovies/meta.ts
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    try {
      const { axios } = providerContext;
      const res = yield axios.get(link);
      const data = res.data;
      const meta = {
        title: "",
        synopsis: "",
        image: "",
        imdbId: ((_a = data == null ? void 0 : data.meta) == null ? void 0 : _a.imdb_id) || "",
        tmdbId: ((_c = (_b = data == null ? void 0 : data.meta) == null ? void 0 : _b.moviedb_id) == null ? void 0 : _c.toString()) || void 0,
        type: ((_d = data == null ? void 0 : data.meta) == null ? void 0 : _d.type) || "movie"
      };
      const baseUrl = yield getBaseUrl("ridomovies");
      let slug = "";
      try {
        const res2 = yield axios.get(
          baseUrl + "/core/api/search?q=" + meta.imdbId
        );
        const data2 = res2.data;
        slug = (_f = (_e = data2 == null ? void 0 : data2.data) == null ? void 0 : _e.items[0]) == null ? void 0 : _f.fullSlug;
        if (!slug || (meta == null ? void 0 : meta.type) === "series") {
          return {
            title: "",
            synopsis: "",
            image: "",
            imdbId: ((_g = data == null ? void 0 : data.meta) == null ? void 0 : _g.imdb_id) || "",
            type: (meta == null ? void 0 : meta.type) || "movie",
            linkList: []
          };
        }
      } catch (err) {
        return {
          title: "",
          synopsis: "",
          image: "",
          imdbId: (meta == null ? void 0 : meta.imdbId) || "",
          type: (meta == null ? void 0 : meta.type) || "movie",
          linkList: []
        };
      }
      const links = [];
      let directLinks = [];
      let season = /* @__PURE__ */ new Map();
      if (meta.type === "series") {
        (_i = (_h = data == null ? void 0 : data.meta) == null ? void 0 : _h.videos) == null ? void 0 : _i.map((video) => {
          if ((video == null ? void 0 : video.season) <= 0) return;
          if (!season.has(video == null ? void 0 : video.season)) {
            season.set(video == null ? void 0 : video.season, []);
          }
          season.get(video == null ? void 0 : video.season).push({
            title: formatEpisodeTitle(video == null ? void 0 : video.episode, video == null ? void 0 : video.name),
            link: ""
          });
        });
        for (const [seasonNum, episodes] of season.entries()) {
          links.push({
            title: "Season " + seasonNum,
            directLinks: episodes
          });
        }
      } else {
        directLinks.push({ title: "Movie", link });
        links.push({ title: "Movie", directLinks });
      }
      return __spreadProps(__spreadValues({}, meta), {
        linkList: links
      });
    } catch (err) {
      return {
        title: "",
        synopsis: "",
        image: "",
        imdbId: "",
        type: "movie",
        linkList: []
      };
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

