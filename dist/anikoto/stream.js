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

// providers/anikoto/stream.ts
var stream_exports = {};
__export(stream_exports, {
  getStream: () => getStream
});


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

// providers/anikoto/stream.ts
var BASE_URL = "https://anikototv.to";
var defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  Accept: "*/*"
};
function decodeBase64(str) {
  if (typeof atob === "function") {
    try {
      return atob(str);
    } catch (e) {
    }
  }
  if (typeof Buffer !== "undefined") {
    try {
      return Buffer.from(str, "base64").toString("binary");
    } catch (e) {
    }
  }
  return "";
}
__name(decodeBase64, "decodeBase64");
function encodeBase64(str) {
  if (typeof btoa === "function") {
    try {
      return btoa(str);
    } catch (e) {
    }
  }
  if (typeof Buffer !== "undefined") {
    try {
      return Buffer.from(str, "binary").toString("base64");
    } catch (e) {
    }
  }
  return "";
}
__name(encodeBase64, "encodeBase64");
function rc4(key, input) {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let a = 0;
  for (let n = 0; n < 256; n++) {
    a = (s[n] + a + key.charCodeAt(n % key.length)) % 256;
    const tmp = s[n];
    s[n] = s[a];
    s[a] = tmp;
  }
  let out = "";
  let n2 = 0;
  let a2 = 0;
  for (let r = 0; r < input.length; r++) {
    n2 = (n2 + 1) % 256;
    a2 = (s[n2] + a2) % 256;
    const tmp2 = s[n2];
    s[n2] = s[a2];
    s[a2] = tmp2;
    const k = s[(s[n2] + s[a2]) % 256];
    out += String.fromCharCode(input.charCodeAt(r) ^ k);
  }
  return out;
}
__name(rc4, "rc4");
function encodeVrf(animeId) {
  const encrypted = rc4("simple-hash", animeId);
  return encodeBase64(encrypted);
}
__name(encodeVrf, "encodeVrf");
var AES_SBOX = [
  99,
  124,
  119,
  123,
  242,
  107,
  111,
  197,
  48,
  1,
  103,
  43,
  254,
  215,
  171,
  118,
  202,
  130,
  201,
  125,
  250,
  89,
  71,
  240,
  173,
  212,
  162,
  175,
  156,
  164,
  114,
  192,
  183,
  253,
  147,
  38,
  54,
  63,
  247,
  204,
  52,
  165,
  229,
  241,
  113,
  216,
  49,
  21,
  4,
  199,
  35,
  195,
  24,
  150,
  5,
  154,
  7,
  18,
  128,
  226,
  235,
  39,
  178,
  117,
  9,
  131,
  44,
  26,
  27,
  110,
  90,
  160,
  82,
  59,
  214,
  179,
  41,
  227,
  47,
  132,
  83,
  209,
  0,
  237,
  32,
  252,
  177,
  91,
  106,
  203,
  190,
  57,
  74,
  76,
  88,
  207,
  208,
  239,
  170,
  251,
  67,
  77,
  51,
  133,
  69,
  249,
  2,
  127,
  80,
  60,
  159,
  168,
  81,
  163,
  64,
  143,
  146,
  157,
  56,
  245,
  188,
  182,
  218,
  33,
  16,
  255,
  243,
  210,
  205,
  12,
  19,
  236,
  95,
  151,
  68,
  23,
  196,
  167,
  126,
  61,
  100,
  93,
  25,
  115,
  96,
  129,
  79,
  220,
  34,
  42,
  144,
  136,
  70,
  238,
  184,
  20,
  222,
  94,
  11,
  219,
  224,
  50,
  58,
  10,
  73,
  6,
  36,
  92,
  194,
  211,
  172,
  98,
  145,
  149,
  228,
  121,
  231,
  200,
  55,
  109,
  141,
  213,
  78,
  169,
  108,
  86,
  244,
  234,
  101,
  122,
  174,
  8,
  186,
  120,
  37,
  46,
  28,
  166,
  180,
  198,
  232,
  221,
  116,
  31,
  75,
  189,
  139,
  138,
  112,
  62,
  181,
  102,
  72,
  3,
  246,
  14,
  97,
  53,
  87,
  185,
  134,
  193,
  29,
  158,
  225,
  248,
  152,
  17,
  105,
  217,
  142,
  148,
  155,
  30,
  135,
  233,
  206,
  85,
  40,
  223,
  140,
  161,
  137,
  13,
  191,
  230,
  66,
  104,
  65,
  153,
  45,
  15,
  176,
  84,
  187,
  22
];
var AES_INV_SBOX = new Uint8Array(256);
for (let i = 0; i < 256; i++) AES_INV_SBOX[AES_SBOX[i]] = i;
var AES_RCON = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54];
function aesKeyExpansion(keyBytes) {
  const w = new Uint32Array(60);
  for (let i = 0; i < 8; i++) {
    w[i] = keyBytes[4 * i] << 24 | keyBytes[4 * i + 1] << 16 | keyBytes[4 * i + 2] << 8 | keyBytes[4 * i + 3];
  }
  for (let i = 8; i < 60; i++) {
    let temp = w[i - 1];
    if (i % 8 === 0) {
      temp = temp << 8 | temp >>> 24;
      temp = AES_SBOX[temp >>> 24 & 255] << 24 | AES_SBOX[temp >>> 16 & 255] << 16 | AES_SBOX[temp >>> 8 & 255] << 8 | AES_SBOX[temp & 255];
      temp ^= AES_RCON[i / 8] << 24;
    } else if (i % 8 === 4) {
      temp = AES_SBOX[temp >>> 24 & 255] << 24 | AES_SBOX[temp >>> 16 & 255] << 16 | AES_SBOX[temp >>> 8 & 255] << 8 | AES_SBOX[temp & 255];
    }
    w[i] = w[i - 8] ^ temp;
  }
  return w;
}
__name(aesKeyExpansion, "aesKeyExpansion");
function aesMul(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 128;
    a = a << 1 & 255;
    if (hi) a ^= 27;
    b >>= 1;
  }
  return p;
}
__name(aesMul, "aesMul");
function aesInvMixColumns(s) {
  for (let c = 0; c < 4; c++) {
    const i = c * 4;
    const a = s[i];
    const b = s[i + 1];
    const d = s[i + 2];
    const e = s[i + 3];
    s[i] = aesMul(14, a) ^ aesMul(11, b) ^ aesMul(13, d) ^ aesMul(9, e);
    s[i + 1] = aesMul(9, a) ^ aesMul(14, b) ^ aesMul(11, d) ^ aesMul(13, e);
    s[i + 2] = aesMul(13, a) ^ aesMul(9, b) ^ aesMul(14, d) ^ aesMul(11, e);
    s[i + 3] = aesMul(11, a) ^ aesMul(13, b) ^ aesMul(9, d) ^ aesMul(14, e);
  }
}
__name(aesInvMixColumns, "aesInvMixColumns");
function aesDecryptBlock(block, w) {
  const state = new Uint8Array(block);
  const Nr = 14;
  for (let c = 0; c < 4; c++) {
    const rk = w[Nr * 4 + c];
    state[c * 4] ^= rk >>> 24 & 255;
    state[c * 4 + 1] ^= rk >>> 16 & 255;
    state[c * 4 + 2] ^= rk >>> 8 & 255;
    state[c * 4 + 3] ^= rk & 255;
  }
  for (let round = Nr - 1; round >= 1; round--) {
    const t12 = state[13];
    state[13] = state[9];
    state[9] = state[5];
    state[5] = state[1];
    state[1] = t12;
    const t22 = state[2];
    state[2] = state[10];
    state[10] = t22;
    const t62 = state[6];
    state[6] = state[14];
    state[14] = t62;
    const t32 = state[3];
    state[3] = state[7];
    state[7] = state[11];
    state[11] = state[15];
    state[15] = t32;
    for (let i = 0; i < 16; i++) state[i] = AES_INV_SBOX[state[i]];
    for (let c = 0; c < 4; c++) {
      const rk = w[round * 4 + c];
      state[c * 4] ^= rk >>> 24 & 255;
      state[c * 4 + 1] ^= rk >>> 16 & 255;
      state[c * 4 + 2] ^= rk >>> 8 & 255;
      state[c * 4 + 3] ^= rk & 255;
    }
    aesInvMixColumns(state);
  }
  const t1 = state[13];
  state[13] = state[9];
  state[9] = state[5];
  state[5] = state[1];
  state[1] = t1;
  const t2 = state[2];
  state[2] = state[10];
  state[10] = t2;
  const t6 = state[6];
  state[6] = state[14];
  state[14] = t6;
  const t3 = state[3];
  state[3] = state[7];
  state[7] = state[11];
  state[11] = state[15];
  state[15] = t3;
  for (let i = 0; i < 16; i++) state[i] = AES_INV_SBOX[state[i]];
  for (let c = 0; c < 4; c++) {
    const rk = w[c];
    state[c * 4] ^= rk >>> 24 & 255;
    state[c * 4 + 1] ^= rk >>> 16 & 255;
    state[c * 4 + 2] ^= rk >>> 8 & 255;
    state[c * 4 + 3] ^= rk & 255;
  }
  return state;
}
__name(aesDecryptBlock, "aesDecryptBlock");
function aesDecryptCbcPureJs(cipherBytes, keyBytes, ivBytes) {
  const w = aesKeyExpansion(keyBytes);
  const out = new Uint8Array(cipherBytes.length);
  let prev = ivBytes;
  for (let offset = 0; offset < cipherBytes.length; offset += 16) {
    const block = cipherBytes.subarray(offset, offset + 16);
    const decrypted = aesDecryptBlock(block, w);
    for (let i = 0; i < 16; i++) {
      out[offset + i] = decrypted[i] ^ prev[i];
    }
    prev = block;
  }
  const pad = out[out.length - 1];
  if (pad > 0 && pad <= 16) {
    return out.subarray(0, out.length - pad);
  }
  return out;
}
__name(aesDecryptCbcPureJs, "aesDecryptCbcPureJs");
function decryptMegaPlay(encStr) {
  return __async(this, null, function* () {
    var _a;
    if (!encStr || typeof encStr !== "string") return "";
    const keyStr = "i?LMTAx0Q6,:}50U";
    const ivStr = "W0;27ToaUpl_P%'c";
    const keyBytes = new Uint8Array(32);
    const ivBytes = new Uint8Array(16);
    for (let i = 0; i < Math.min(32, keyStr.length); i++) {
      keyBytes[i] = keyStr.charCodeAt(i);
    }
    for (let i = 0; i < Math.min(16, ivStr.length); i++) {
      ivBytes[i] = ivStr.charCodeAt(i);
    }
    let b64 = encStr.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) {
      b64 += "====".slice(pad);
    }
    const binaryStr = typeof atob === "function" ? atob(b64) : decodeBase64(b64);
    const cipherBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      cipherBytes[i] = binaryStr.charCodeAt(i);
    }
    if (typeof globalThis !== "undefined" && ((_a = globalThis.crypto) == null ? void 0 : _a.subtle)) {
      try {
        const cryptoKey = yield globalThis.crypto.subtle.importKey(
          "raw",
          keyBytes,
          { name: "AES-CBC" },
          false,
          ["decrypt"]
        );
        const decryptedBuffer = yield globalThis.crypto.subtle.decrypt(
          { name: "AES-CBC", iv: ivBytes },
          cryptoKey,
          cipherBytes
        );
        if (typeof TextDecoder !== "undefined") {
          return new TextDecoder().decode(decryptedBuffer);
        } else {
          const bytes = new Uint8Array(decryptedBuffer);
          let str = "";
          for (let i = 0; i < bytes.length; i++) {
            str += String.fromCharCode(bytes[i]);
          }
          return decodeURIComponent(escape(str));
        }
      } catch (e) {
      }
    }
    try {
      const decryptedBytes = aesDecryptCbcPureJs(cipherBytes, keyBytes, ivBytes);
      if (typeof TextDecoder !== "undefined") {
        return new TextDecoder().decode(decryptedBytes);
      } else {
        let str = "";
        for (let i = 0; i < decryptedBytes.length; i++) {
          str += String.fromCharCode(decryptedBytes[i]);
        }
        return decodeURIComponent(escape(str));
      }
    } catch (e) {
    }
    return "";
  });
}
__name(decryptMegaPlay, "decryptMegaPlay");
function inferLang(label) {
  const l = (label || "").toLowerCase();
  if (l.includes("english") || l.includes("eng")) return "en";
  if (l.includes("spanish") || l.includes("spa") || l.includes("es-")) return "es";
  if (l.includes("french") || l.includes("fra") || l.includes("fre")) return "fr";
  if (l.includes("german") || l.includes("deu") || l.includes("ger")) return "de";
  if (l.includes("portuguese") || l.includes("por")) return "pt";
  if (l.includes("italian") || l.includes("ita")) return "it";
  if (l.includes("japanese") || l.includes("jpn")) return "ja";
  if (l.includes("chinese") || l.includes("chi") || l.includes("zho")) return "zh";
  if (l.includes("indonesian") || l.includes("ind")) return "id";
  if (l.includes("thai") || l.includes("tha")) return "th";
  if (l.includes("vietnamese") || l.includes("vie")) return "vi";
  if (l.includes("arabic") || l.includes("ara")) return "ar";
  if (l.includes("hindi") || l.includes("hin")) return "hi";
  if (l.includes("korean") || l.includes("kor")) return "ko";
  if (l.includes("russian") || l.includes("rus")) return "ru";
  return "und";
}
__name(inferLang, "inferLang");
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b;
    try {
      const { axios, cheerio } = providerContext;
      const payload = (() => {
        try {
          return JSON.parse(link);
        } catch (e) {
          return { slug: link, epNum: "1" };
        }
      })();
      let slug = payload.slug || "";
      let epNum = String(payload.epNum || "1");
      let dataIds = payload.dataIds || "";
      if (!slug && typeof link === "string") {
        slug = link;
      }
      if (slug.includes("/watch/")) {
        const match = slug.match(/\/watch\/([^/]+)(?:\/ep-(\d+))?/);
        if (match) {
          slug = match[1];
          if (match[2]) epNum = match[2];
        }
      } else if (slug.startsWith("http")) {
        const parts = slug.replace(/\/+$/, "").split("/");
        slug = parts[parts.length - 1];
      }
      if (!slug) return [];
      const watchUrl = `${BASE_URL}/watch/${slug}/ep-${epNum || 1}`;
      const headers = __spreadProps(__spreadValues({}, defaultHeaders), {
        Referer: `${BASE_URL}/`
      });
      if (!dataIds) {
        const detailRes = yield axios.get(watchUrl, { headers });
        const $d = cheerio.load(detailRes.data);
        const animeId = $d(
          "#watch-page, #watch-main, .watch-wrap, [data-id]"
        ).first().attr("data-id");
        if (animeId) {
          const vrf = encodeURIComponent(encodeVrf(animeId));
          const epRes = yield axios.get(
            `${BASE_URL}/ajax/episode/list/${animeId}?vrf=${vrf}&style=default`,
            {
              headers: __spreadProps(__spreadValues({}, headers), {
                "X-Requested-With": "XMLHttpRequest",
                Referer: watchUrl
              })
            }
          );
          if ((_a = epRes.data) == null ? void 0 : _a.result) {
            const $ep = cheerio.load(epRes.data.result);
            const epEl = $ep(
              `ul.ep-range a[data-num="${epNum}"], .ep-range a[data-num="${epNum}"], a[data-ids]`
            ).first();
            dataIds = epEl.attr("data-ids") || "";
          }
        }
      }
      if (!dataIds) {
        return [];
      }
      const serverListUrl = `${BASE_URL}/ajax/server/list?servers=${encodeURIComponent(dataIds)}`;
      const srvRes = yield axios.get(serverListUrl, {
        headers: __spreadProps(__spreadValues({}, headers), {
          "X-Requested-With": "XMLHttpRequest",
          Referer: watchUrl
        })
      });
      if (!srvRes.data || srvRes.data.status !== 200 || !srvRes.data.result) {
        return [];
      }
      const $s = cheerio.load(srvRes.data.result);
      const tasks = [];
      const seenLinkIds = /* @__PURE__ */ new Set();
      $s("div.type, .server-type, div.types > div.type, div.servers > div.type").each((_, typeEl) => {
        const dataType = $s(typeEl).attr("data-type") || "sub";
        $s(typeEl).find("[data-link-id], [data-id], .item").each((_2, sEl) => {
          const linkId = $s(sEl).attr("data-link-id") || $s(sEl).attr("data-id") || "";
          const serverName = $s(sEl).text().trim() || "Server";
          if (linkId && !seenLinkIds.has(linkId)) {
            seenLinkIds.add(linkId);
            tasks.push({ dataType, serverName, linkId });
          }
        });
      });
      const streams = [];
      const seenStreamLinks = /* @__PURE__ */ new Set();
      const addStream = /* @__PURE__ */ __name((stream) => {
        if (!stream.link || seenStreamLinks.has(stream.link)) return;
        seenStreamLinks.add(stream.link);
        streams.push(stream);
      }, "addStream");
      const skipTimings = yield (_b = providerContext.kvStore) == null ? void 0 : _b.get("anikoto_skipTimings");
      const skipTimingsEnabled = skipTimings != null ? skipTimings : true;
      yield Promise.all(
        tasks.map((task) => __async(null, null, function* () {
          var _a2, _b2, _c, _d, _e, _f, _g, _h, _i;
          try {
            const getUrl = `${BASE_URL}/ajax/server?get=${encodeURIComponent(
              task.linkId
            )}`;
            const getRes = yield axios.get(getUrl, {
              headers: __spreadProps(__spreadValues({}, headers), {
                "X-Requested-With": "XMLHttpRequest",
                Referer: watchUrl
              }),
              timeout: 8e3
            });
            const iframeUrl = (_b2 = (_a2 = getRes.data) == null ? void 0 : _a2.result) == null ? void 0 : _b2.url;
            if (!iframeUrl) return;
            let skipIntervals = void 0;
            if (skipTimingsEnabled) {
              const skipData = (_d = (_c = getRes.data) == null ? void 0 : _c.result) == null ? void 0 : _d.skip_data;
              if (skipData && typeof skipData === "object") {
                const intervals = [];
                if (Array.isArray(skipData.intro) && skipData.intro.length >= 2) {
                  const from = Number(skipData.intro[0]);
                  const to = Number(skipData.intro[1]);
                  if (!isNaN(from) && !isNaN(to) && to > from) {
                    intervals.push({ title: "Intro", from, to });
                  }
                }
                if (Array.isArray(skipData.outro) && skipData.outro.length >= 2) {
                  const from = Number(skipData.outro[0]);
                  const to = Number(skipData.outro[1]);
                  if (!isNaN(from) && !isNaN(to) && to > from) {
                    intervals.push({ title: "Outro", from, to });
                  }
                }
                if (intervals.length > 0) {
                  skipIntervals = intervals;
                }
              }
            }
            let host = "";
            try {
              host = new URL(iframeUrl).host;
            } catch (e) {
              host = ((_e = iframeUrl.split("://")[1]) == null ? void 0 : _e.split("/")[0]) || "";
            }
            const audioLabel = task.dataType.toUpperCase();
            if (iframeUrl.includes("#")) {
              const fragment = iframeUrl.substring(iframeUrl.indexOf("#") + 1);
              if (fragment) {
                try {
                  const decoded = decodeBase64(fragment);
                  if (decoded && decoded.startsWith("http")) {
                    const kiwiHeaders = {
                      Referer: "https://vibeplayer.site/",
                      Origin: "https://vibeplayer.site",
                      "User-Agent": defaultHeaders["User-Agent"]
                    };
                    addStream({
                      server: `${task.serverName} (${audioLabel})`,
                      link: decoded,
                      type: "m3u8",
                      quality: "auto",
                      headers: kiwiHeaders,
                      skip: skipIntervals
                    });
                    try {
                      const m3u8Res = yield axios.get(decoded, {
                        headers: kiwiHeaders,
                        timeout: 6e3
                      });
                      const lines = m3u8Res.data.split("\n");
                      const baseUrl = decoded.substring(0, decoded.lastIndexOf("/") + 1);
                      for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line.startsWith("#EXT-X-STREAM-INF")) {
                          const resMatch = line.match(/RESOLUTION=\d+x(\d+)/);
                          const quality = resMatch ? `${resMatch[1]}p` : "unknown";
                          const nextLine = (_f = lines[i + 1]) == null ? void 0 : _f.trim();
                          if (nextLine && !nextLine.startsWith("#")) {
                            const streamUrl = nextLine.startsWith("http") ? nextLine : baseUrl + nextLine;
                            addStream({
                              server: `${task.serverName} (${audioLabel}) ${quality}`,
                              link: streamUrl,
                              type: "m3u8",
                              quality,
                              headers: kiwiHeaders,
                              skip: skipIntervals
                            });
                          }
                        }
                      }
                    } catch (e) {
                    }
                  }
                } catch (e) {
                }
              }
            }
            try {
              const pageRes = yield axios.get(iframeUrl, {
                headers: __spreadProps(__spreadValues({}, headers), {
                  Referer: `https://${host}/`,
                  Origin: `https://${host}`
                }),
                timeout: 8e3
              });
              const matchId = pageRes.data.match(/data-id=["']?([^"'\s>]+)["']?/i);
              const matchRealId = pageRes.data.match(/data-realid=["']?([^"'\s>]+)["']?/i);
              const urlIdMatch = iframeUrl.match(/\/stream\/[^/]+\/([^/?#]+)/);
              const dataId = matchId ? matchId[1] : urlIdMatch ? urlIdMatch[1] : "";
              const realId = matchRealId ? matchRealId[1] : "";
              const idCandidates = [dataId, realId].filter(Boolean);
              if (idCandidates.length > 0) {
                let sParam = "";
                try {
                  const parsedUrl = new URL(iframeUrl);
                  sParam = parsedUrl.searchParams.get("s") || "";
                } catch (e) {
                  const matchS = iframeUrl.match(/[?&]s=([^&]+)/);
                  if (matchS) sParam = matchS[1];
                }
                let typeParam = task.dataType;
                if (iframeUrl.includes("/hsub")) typeParam = "hsub";
                else if (iframeUrl.includes("/hdub")) typeParam = "hdub";
                const typeCandidates = [typeParam, task.dataType, "sub", "dub"].filter((v, idx, arr) => !!v && arr.indexOf(v) === idx);
                const sCandidates = [sParam, "tcdn", "bcdn", ""].filter((v, idx, arr) => arr.indexOf(v) === idx);
                const apiHeaders = __spreadProps(__spreadValues({}, headers), {
                  "X-Requested-With": "XMLHttpRequest",
                  Referer: iframeUrl,
                  Origin: `https://${host}`
                });
                let srcData = null;
                let masterUrl = "";
                outerLoop: for (const currId of idCandidates) {
                  for (const currType of typeCandidates) {
                    for (const currS of sCandidates) {
                      const sQuery = currS ? `&s=${encodeURIComponent(currS)}` : "";
                      const endpoints = [
                        `https://${host}/stream/getSources?id=${currId}&type=${currType}${sQuery}`,
                        `https://${host}/stream/getSourcesNew?id=${currId}&type=${currType}${sQuery}`,
                        `https://${host}/stream/getSources?id=${currId}&id=${currId}&type=${currType}&type=${currType}${sQuery}`
                      ];
                      for (const endpoint of endpoints) {
                        try {
                          const srcRes = yield axios.get(endpoint, {
                            headers: apiHeaders,
                            timeout: 8e3
                          });
                          const data = srcRes.data;
                          if (data) {
                            let candidate = "";
                            if (data.enc && typeof data.enc === "string") {
                              try {
                                const decrypted = yield decryptMegaPlay(data.enc);
                                if (decrypted) {
                                  try {
                                    const parsed = JSON.parse(decrypted);
                                    if (typeof parsed === "string" && parsed.startsWith("http")) {
                                      candidate = parsed;
                                    } else if (typeof (parsed == null ? void 0 : parsed.file) === "string" && parsed.file.startsWith("http")) {
                                      candidate = parsed.file;
                                    } else if (typeof (parsed == null ? void 0 : parsed.sources) === "string" && parsed.sources.startsWith("http")) {
                                      candidate = parsed.sources;
                                    } else if (typeof ((_g = parsed == null ? void 0 : parsed.sources) == null ? void 0 : _g.file) === "string" && parsed.sources.file.startsWith("http")) {
                                      candidate = parsed.sources.file;
                                    } else if (Array.isArray(parsed == null ? void 0 : parsed.sources) && parsed.sources.length > 0) {
                                      const first = parsed.sources[0];
                                      candidate = typeof first === "string" ? first : (first == null ? void 0 : first.file) || "";
                                    }
                                  } catch (e) {
                                    if (decrypted.startsWith("http")) {
                                      candidate = decrypted;
                                    }
                                  }
                                }
                              } catch (e) {
                              }
                            }
                            if (!candidate) {
                              if (typeof data.sources === "string" && data.sources.startsWith("http")) {
                                candidate = data.sources;
                              } else if (typeof ((_h = data.sources) == null ? void 0 : _h.file) === "string" && data.sources.file.startsWith("http")) {
                                candidate = data.sources.file;
                              } else if (Array.isArray(data.sources) && data.sources.length > 0) {
                                const first = data.sources[0];
                                candidate = typeof first === "string" ? first : (first == null ? void 0 : first.file) || "";
                              } else if (typeof data.file === "string" && data.file.startsWith("http")) {
                                candidate = data.file;
                              }
                            }
                            if (candidate && candidate.startsWith("http")) {
                              masterUrl = candidate;
                              srcData = data;
                              break outerLoop;
                            }
                          }
                        } catch (e) {
                        }
                      }
                    }
                  }
                }
                if (masterUrl) {
                  const streamHeaders = {
                    Referer: `https://${host}/`,
                    Origin: `https://${host}`,
                    "User-Agent": defaultHeaders["User-Agent"]
                  };
                  const subtitles = ((srcData == null ? void 0 : srcData.tracks) || []).filter((t) => t.file && t.label && typeof t.file === "string" && t.file.startsWith("http")).map((t) => ({
                    title: t.label,
                    language: inferLang(t.label),
                    type: "text/vtt",
                    uri: `https://fetch.1proxy.workers.dev/fetch?url=${encodeURIComponent(
                      t.file
                    )}&headers=${encodeURIComponent(JSON.stringify(streamHeaders))}`
                  }));
                  addStream({
                    server: `${task.serverName} (${audioLabel})`,
                    link: masterUrl,
                    type: "m3u8",
                    quality: "auto",
                    subtitles: subtitles.length > 0 ? subtitles : void 0,
                    headers: streamHeaders,
                    skip: skipIntervals
                  });
                  try {
                    const m3u8Res = yield axios.get(masterUrl, {
                      headers: streamHeaders,
                      timeout: 6e3
                    });
                    const lines = m3u8Res.data.split("\n");
                    const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf("/") + 1);
                    for (let i = 0; i < lines.length; i++) {
                      const line = lines[i].trim();
                      if (line.startsWith("#EXT-X-STREAM-INF")) {
                        const resMatch = line.match(/RESOLUTION=\d+x(\d+)/);
                        const quality = resMatch ? `${resMatch[1]}p` : "unknown";
                        const nextLine = (_i = lines[i + 1]) == null ? void 0 : _i.trim();
                        if (nextLine && !nextLine.startsWith("#")) {
                          const streamUrl = nextLine.startsWith("http") ? nextLine : baseUrl + nextLine;
                          addStream({
                            server: `${task.serverName} (${audioLabel}) ${quality}`,
                            link: streamUrl,
                            type: "m3u8",
                            quality,
                            subtitles: subtitles.length > 0 ? subtitles : void 0,
                            headers: streamHeaders,
                            skip: skipIntervals
                          });
                        }
                      }
                    }
                  } catch (e) {
                  }
                }
              }
            } catch (e) {
            }
          } catch (e) {
          }
        }))
      );
      return streams;
    } catch (err) {
      throwProviderError("Anikoto", "stream", err);
    }
  });
}, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

