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

// providers/mxplayer/stream.ts
var stream_exports = {};
__export(stream_exports, {
  getStream: () => getStream
});

var ENDPOINT_URL = "https://d3sgzbosmwirao.cloudfront.net/";
var API_URL = "https://api.mxplayer.in/v1/web";
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    type,
    providerContext
  }) {
    var _a, _b, _c;
    const { axios } = providerContext;
    const streamLinks = [];
    let streamObj = null;
    if (link.startsWith("{")) {
      try {
        const data = JSON.parse(link);
        streamObj = data.stream;
      } catch (e) {
        console.error("Failed to parse stream JSON");
      }
    } else if (link.startsWith("http") && link.includes("mxplayer.in")) {
      try {
        const idMatch = link.match(/movie\/([a-zA-Z0-9]+)/);
        if (idMatch && idMatch[1]) {
          const id = idMatch[1];
          const apiUrl = `${API_URL}/detail/tab/movierecommended?type=movie&id=${id}`;
          const res = yield axios.get(apiUrl, {
            headers: {
              Referer: "https://www.mxplayer.in/",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
          });
          streamObj = ((_c = (_b = (_a = res.data) == null ? void 0 : _a.items) == null ? void 0 : _b[0]) == null ? void 0 : _c.stream) || null;
        }
      } catch (e) {
        console.error("MX Movie API error", e);
      }
    }
    if (streamObj) {
      const extract = /* @__PURE__ */ __name((obj, label) => {
        if (!obj) return;
        ["high", "base", "main"].forEach((q) => {
          const url = obj[q];
          if (url) {
            streamLinks.push({
              server: `MX ${label.toUpperCase()} ${q}`,
              link: normalizeUrl(url),
              type: label === "hls" ? "m3u8" : "dash",
              headers: {
                Referer: "https://www.mxplayer.in/"
              }
            });
          }
        });
      }, "extract");
      if (streamObj.hls) extract(streamObj.hls, "hls");
      if (streamObj.dash) extract(streamObj.dash, "dash");
      if (streamObj.mxplay) {
        if (streamObj.mxplay.hls) extract(streamObj.mxplay.hls, "hls");
        if (streamObj.mxplay.dash) extract(streamObj.mxplay.dash, "dash");
      }
      if (streamObj.thirdParty) {
        if (streamObj.thirdParty.hlsUrl) {
          streamLinks.push({
            server: "ThirdParty HLS",
            link: normalizeUrl(streamObj.thirdParty.hlsUrl),
            type: "m3u8"
          });
        }
        if (streamObj.thirdParty.dashUrl) {
          streamLinks.push({
            server: "ThirdParty DASH",
            link: normalizeUrl(streamObj.thirdParty.dashUrl),
            type: "dash"
          });
        }
      }
    }
    return streamLinks;
  });
}, "getStream");
function normalizeUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return ENDPOINT_URL + url;
}
__name(normalizeUrl, "normalizeUrl");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

