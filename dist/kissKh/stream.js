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

// providers/kissKh/stream.ts
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

// providers/kissKh/keyGenerator.ts
var DEFAULT_CONFIG = {
  viGuid: "62f176f3bb1b5b8e70e39932ad34a0c7",
  subGuid: "VgV52sWhwvBSf8BsM3BRY9weWiiCbtGp",
  appVer: "2.8.10",
  platformVer: 4830201,
  appName: "kisskh"
};
var cachedConfig = __spreadValues({}, DEFAULT_CONFIG);
var configFetchedAt = 0;
var CONFIG_CACHE_TTL = 3600 * 1e3;
function getKisskhConfig(axios, baseUrl = "https://kisskh.is") {
  return __async(this, null, function* () {
    const now = Date.now();
    if (now - configFetchedAt < CONFIG_CACHE_TTL) {
      return cachedConfig;
    }
    try {
      const htmlRes = yield axios.get(baseUrl, { timeout: 4e3 });
      const html = typeof htmlRes.data === "string" ? htmlRes.data : "";
      const runtimeMatch = html.match(/src=["'](runtime\.[a-f0-9]+\.js)["']/i);
      if (!runtimeMatch) return DEFAULT_CONFIG;
      const runtimeRes = yield axios.get(`${baseUrl}/${runtimeMatch[1]}`, {
        timeout: 4e3
      });
      const runtimeJs = typeof runtimeRes.data === "string" ? runtimeRes.data : "";
      const chunk502Match = runtimeJs.match(/502\s*:\s*["']([a-f0-9]+)["']/);
      if (!chunk502Match) return DEFAULT_CONFIG;
      const chunkUrl = `${baseUrl}/502.${chunk502Match[1]}.js`;
      const chunkRes = yield axios.get(chunkUrl, { timeout: 4e3 });
      const chunkJs = typeof chunkRes.data === "string" ? chunkRes.data : "";
      const viMatch = chunkJs.match(/viGuid\s*=\s*["']([^"']+)["']/);
      const subMatch = chunkJs.match(/subGuid\s*=\s*["']([^"']+)["']/);
      const appVerMatch = chunkJs.match(/appVer\s*=\s*["']([^"']+)["']/);
      const platMatch = chunkJs.match(/platformVer\s*=\s*([0-9]+)/);
      cachedConfig = {
        viGuid: viMatch ? viMatch[1] : DEFAULT_CONFIG.viGuid,
        subGuid: subMatch ? subMatch[1] : DEFAULT_CONFIG.subGuid,
        appVer: appVerMatch ? appVerMatch[1] : DEFAULT_CONFIG.appVer,
        platformVer: platMatch ? parseInt(platMatch[1], 10) : DEFAULT_CONFIG.platformVer,
        appName: DEFAULT_CONFIG.appName
      };
      configFetchedAt = now;
      return cachedConfig;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });
}
__name(getKisskhConfig, "getKisskhConfig");
function toWords(str) {
  const len = str.length;
  const words = [];
  for (let i = 0; i < len; i++) {
    words[i >>> 2] |= (255 & str.charCodeAt(i)) << 24 - i % 4 * 8;
  }
  return [words, len];
}
__name(toWords, "toWords");
function wordsToHex(words, sigBytes) {
  const res = [];
  for (let i = 0; i < sigBytes; i++) {
    const byte = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
    res.push(byte.toString(16).padStart(2, "0"));
  }
  return res.join("");
}
__name(wordsToHex, "wordsToHex");
function substr48(s) {
  return (s || "").substring(0, 48);
}
__name(substr48, "substr48");
function stringHash(s) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
  }
  return hash;
}
__name(stringHash, "stringHash");
function pkcs7Pad(s) {
  const pad = 16 - s.length % 16;
  for (let i = 0; i < pad; ++i) {
    s += String.fromCharCode(pad);
  }
  return s;
}
__name(pkcs7Pad, "pkcs7Pad");
var roundKeys = [
  1332468387,
  -1641050960,
  2136896045,
  -1629555948,
  1399201960,
  -850809832,
  -1307058635,
  751381793,
  -1933648423,
  1106735553,
  -203378700,
  -550927659,
  766369351,
  1817882502,
  -1615200142,
  1083409063,
  -104955314,
  -1780208184,
  173944250,
  1254993693,
  1422337688,
  -1054667952,
  -880990486,
  -2119136777,
  -1822404972,
  1380140484,
  -1723964626,
  412019417,
  -890799303,
  -1734066435,
  26893779,
  420787978,
  -1337058067,
  686432784,
  695238595,
  811911369,
  -391724567,
  -1068702727,
  -381903814,
  -648522509,
  -1266234148,
  1959407397,
  -1644776673,
  1152313324
];
var tables = [roundKeys];
(/* @__PURE__ */ __name((function initTables() {
  const sbox = [];
  const t0 = [];
  const t1 = [];
  const t2 = [];
  const t3 = [];
  const d = [];
  for (let i = 0; i < 256; i++) {
    d[i] = i < 128 ? i << 1 : i << 1 ^ 283;
  }
  let x = 0;
  let xi = 0;
  for (let i = 0; i < 256; i++) {
    let sx = xi ^ xi << 1 ^ xi << 2 ^ xi << 3 ^ xi << 4;
    sx = sx >>> 8 ^ 255 & sx ^ 99;
    sbox[x] = sx;
    const d_x = d[x];
    const d_d_x = d[d[d_x]];
    const m = 257 * d[sx] ^ 16843008 * sx;
    t0[x] = m << 24 | m >>> 8;
    t1[x] = m << 16 | m >>> 16;
    t2[x] = m << 8 | m >>> 24;
    t3[x] = m;
    if (x) {
      x = d_x ^ d[d[d[d_d_x ^ d_x]]];
      xi ^= d[d[xi]];
    } else {
      x = xi = 1;
    }
  }
  tables.push(t0, t1, t2, t3, sbox);
}), "initTables"))();
function encryptBlock(words, offset) {
  const [rk, t0, t1, t2, t3, sbox] = tables;
  let iv;
  if (offset === 0) {
    iv = [22039283, 1457920463, 776125350, -1941999367];
  } else {
    iv = words.slice(offset - 4, offset);
  }
  for (let i = 0; i < 4; i++) {
    words[offset + i] ^= iv[i];
  }
  let s0 = words[offset] ^ rk[0];
  let s1 = words[offset + 1] ^ rk[1];
  let s2 = words[offset + 2] ^ rk[2];
  let s3 = words[offset + 3] ^ rk[3];
  let keyIdx = 4;
  for (let round = 1; round < 10; round++) {
    const a0 = t0[s0 >>> 24] ^ t1[s1 >>> 16 & 255] ^ t2[s2 >>> 8 & 255] ^ t3[s3 & 255] ^ rk[keyIdx++];
    const a1 = t0[s1 >>> 24] ^ t1[s2 >>> 16 & 255] ^ t2[s3 >>> 8 & 255] ^ t3[s0 & 255] ^ rk[keyIdx++];
    const a2 = t0[s2 >>> 24] ^ t1[s3 >>> 16 & 255] ^ t2[s0 >>> 8 & 255] ^ t3[s1 & 255] ^ rk[keyIdx++];
    const a3 = t0[s3 >>> 24] ^ t1[s0 >>> 16 & 255] ^ t2[s1 >>> 8 & 255] ^ t3[s2 & 255] ^ rk[keyIdx++];
    s0 = a0;
    s1 = a1;
    s2 = a2;
    s3 = a3;
  }
  const o0 = (sbox[s0 >>> 24] << 24 | sbox[s1 >>> 16 & 255] << 16 | sbox[s2 >>> 8 & 255] << 8 | sbox[s3 & 255]) ^ rk[keyIdx++];
  const o1 = (sbox[s1 >>> 24] << 24 | sbox[s2 >>> 16 & 255] << 16 | sbox[s3 >>> 8 & 255] << 8 | sbox[s0 & 255]) ^ rk[keyIdx++];
  const o2 = (sbox[s2 >>> 24] << 24 | sbox[s3 >>> 16 & 255] << 16 | sbox[s0 >>> 8 & 255] << 8 | sbox[s1 & 255]) ^ rk[keyIdx++];
  const o3 = (sbox[s3 >>> 24] << 24 | sbox[s0 >>> 16 & 255] << 16 | sbox[s1 >>> 8 & 255] << 8 | sbox[s2 & 255]) ^ rk[keyIdx++];
  words[offset] = o0;
  words[offset + 1] = o1;
  words[offset + 2] = o2;
  words[offset + 3] = o3;
}
__name(encryptBlock, "encryptBlock");
function generateKisskhKey(episodeId, guid, appVer = DEFAULT_CONFIG.appVer, platformVer = DEFAULT_CONFIG.platformVer, appName = DEFAULT_CONFIG.appName) {
  const parts = [
    "",
    episodeId,
    null,
    "mg3c3b04ba",
    appVer,
    guid,
    platformVer,
    substr48(appName),
    substr48(appName.toLowerCase()),
    substr48(appName),
    appName,
    appName,
    appName,
    "00",
    ""
  ];
  const initialJoin = parts.join("|");
  const hash = stringHash(initialJoin);
  parts.splice(1, 0, hash);
  const paddedStr = pkcs7Pad(parts.join("|"));
  const [words, sigBytes] = toWords(paddedStr);
  for (let offset = 0; offset < words.length; offset += 4) {
    encryptBlock(words, offset);
  }
  return wordsToHex(words, sigBytes).toUpperCase();
}
__name(generateKisskhKey, "generateKisskhKey");

// providers/kissKh/stream.ts
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    type,
    signal,
    providerContext,
    isDownload
  }) {
    var _a;
    try {
      const { axios, commonHeaders } = providerContext;
      const streamLinks = [];
      const subtitles = [];
      let baseUrl = "https://kisskh.is";
      try {
        const resolved = yield getBaseUrl("kissKh");
        if (resolved) {
          baseUrl = resolved.replace(/\/+$/, "");
        }
      } catch (e) {
      }
      let episodeId = link.trim();
      if (episodeId.includes("ep=")) {
        const match = episodeId.match(/[?&]ep=([0-9]+)/);
        if (match) episodeId = match[1];
      } else if (episodeId.includes("/Episode/")) {
        const match = episodeId.match(/\/Episode\/([0-9]+)/);
        if (match) episodeId = match[1];
      }
      const config = yield getKisskhConfig(axios, baseUrl);
      const streamKey = generateKisskhKey(
        episodeId,
        config.viGuid,
        config.appVer,
        config.platformVer,
        config.appName
      );
      const subKey = generateKisskhKey(
        episodeId,
        config.subGuid,
        config.appVer,
        config.platformVer,
        config.appName
      );
      const headers = __spreadProps(__spreadValues({}, commonHeaders || {}), {
        Accept: "application/json, text/plain, */*",
        Referer: `${baseUrl}/`,
        Origin: baseUrl,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      });
      try {
        const subUrl = `${baseUrl}/api/Sub/${episodeId}?kkey=${subKey}`;
        const subRes = yield axios.get(subUrl, {
          headers,
          signal,
          timeout: 8e3
        });
        const subData = Array.isArray(subRes.data) ? subRes.data : [];
        for (const sub of subData) {
          if (sub == null ? void 0 : sub.src) {
            subtitles.push({
              title: sub.label || "Subtitle",
              language: sub.land || sub.label || "en",
              type: sub.src.includes(".vtt") ? "text/vtt" : "application/x-subrip",
              uri: sub.src
            });
          }
        }
      } catch (e) {
      }
      const streamUrl = `${baseUrl}/api/DramaList/Episode/${episodeId}.png?err=false&ts=null&time=null&kkey=${streamKey}`;
      const res = yield axios.get(streamUrl, {
        headers,
        responseType: "json",
        signal,
        timeout: 1e4
      });
      let resData = res.data;
      if (typeof resData === "string") {
        try {
          resData = JSON.parse(resData);
        } catch (e) {
        }
      }
      if (resData == null ? void 0 : resData.Video) {
        const videoUrl = resData.Video;
        const isM3u8 = videoUrl.includes(".m3u8") || resData.Type === 1;
        const qualityMatch = videoUrl.match(/\b(360|480|720|1080|2160)p?\b/i);
        const quality = qualityMatch ? qualityMatch[1] : videoUrl.includes(".mp4") ? "1080" : "auto";
        let variantsFound = false;
        if (isM3u8) {
          try {
            const playlistRes = yield axios.get(videoUrl, {
              headers: {
                Referer: `${baseUrl}/`,
                Origin: baseUrl
              },
              signal,
              timeout: 5e3
            });
            const playlistText = typeof playlistRes.data === "string" ? playlistRes.data : "";
            if (playlistText.includes("#EXT-X-STREAM-INF:")) {
              const lines = playlistText.split("\n");
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith("#EXT-X-STREAM-INF:")) {
                  const resMatch = lines[i].match(/RESOLUTION=\d+x(\d+)/i);
                  const varQuality = resMatch ? resMatch[1] : "auto";
                  const nextLine = (_a = lines[i + 1]) == null ? void 0 : _a.trim();
                  if (nextLine && !nextLine.startsWith("#")) {
                    let varUrl = nextLine;
                    if (!varUrl.startsWith("http")) {
                      try {
                        varUrl = new URL(nextLine, videoUrl).href;
                      } catch (e) {
                        const base = videoUrl.substring(
                          0,
                          videoUrl.lastIndexOf("/") + 1
                        );
                        varUrl = base + nextLine;
                      }
                    }
                    streamLinks.push({
                      server: `KissKH (${varQuality}p)`,
                      link: varUrl,
                      type: "m3u8",
                      quality: varQuality,
                      subtitles,
                      headers: {
                        Referer: `${baseUrl}/`,
                        Origin: baseUrl
                      }
                    });
                    variantsFound = true;
                  }
                }
              }
            }
          } catch (e) {
          }
        }
        if (!variantsFound) {
          streamLinks.push({
            server: "KissKH",
            link: videoUrl,
            type: isM3u8 ? "m3u8" : "mp4",
            quality,
            subtitles,
            headers: {
              Referer: `${baseUrl}/`,
              Origin: baseUrl
            }
          });
        }
      }
      if (resData == null ? void 0 : resData.Video_tmp) {
        const videoUrl = resData.Video_tmp;
        streamLinks.push({
          server: "KissKH (Backup)",
          link: videoUrl,
          type: videoUrl.includes(".m3u8") ? "m3u8" : "mp4",
          quality: "auto",
          subtitles,
          headers: {
            Referer: `${baseUrl}/`,
            Origin: baseUrl
          }
        });
      }
      if (isDownload) {
        streamLinks.sort((a, b) => {
          if (a.type === "mp4" && b.type !== "mp4") return -1;
          if (a.type !== "mp4" && b.type === "mp4") return 1;
          return 0;
        });
      }
      return streamLinks;
    } catch (err) {
      console.error("kisskh getStream error:", err);
      return [];
    }
  });
}, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

