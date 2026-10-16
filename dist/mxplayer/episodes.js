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

// providers/mxplayer/episodes.ts
var episodes_exports = {};
__export(episodes_exports, {
  getEpisodes: () => getEpisodes
});

var API_URL = "https://api.mxplayer.in/v1/web";
var IMAGE_URL = "https://qqcdnpictest.mxplay.com/";
var defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Referer: "https://www.mxplayer.in/"
};
var getEpisodes = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    url,
    // This is either a Season ID (from meta) or a Web URL (for movies)
    providerContext
  }) {
    var _a, _b;
    const { axios } = providerContext;
    const isWebUrl = url.startsWith("http");
    if (isWebUrl) {
      return [{
        title: "Full Movie",
        link: url,
        // Pass the web URL to stream.ts
        image: ""
      }];
    }
    const seasonId = url;
    const episodes = [];
    let page = 0;
    let nextQuery = null;
    const userid = "";
    const endParam = `&device-density=2&userid=${userid}&platform=com.mxplay.desktop&content-languages=hi,en&kids-mode-enabled=false`;
    do {
      let apiUrl = `${API_URL}/detail/tab/tvshowepisodes?type=season&id=${seasonId}&sortOrder=0${endParam}`;
      if (nextQuery) {
        apiUrl = `${API_URL}/detail/tab/tvshowepisodes?type=season&${nextQuery}&id=${seasonId}&sortOrder=0${endParam}`;
      }
      try {
        const res = yield axios.get(apiUrl, { headers: defaultHeaders });
        const data = res.data;
        const items = data.items || [];
        for (const item of items) {
          const title = item.title || `Episode ${item.sequence}`;
          const imgPath = (_b = (_a = item.imageInfo) == null ? void 0 : _a[0]) == null ? void 0 : _b.url;
          const image = imgPath ? IMAGE_URL + imgPath : "";
          const streamData = JSON.stringify({
            stream: item.stream,
            videoHash: item.videoHash
            // sometimes needed
          });
          episodes.push({
            title,
            link: streamData,
            // We pass data, not a URL
            image
          });
        }
        nextQuery = data.next;
      } catch (e) {
        console.error("Error fetching episodes", e);
        break;
      }
    } while (nextQuery);
    return episodes;
  });
}, "getEpisodes");
exports.getEpisodes = getEpisodes;
// Annotate the CommonJS export names for ESM import in node:

