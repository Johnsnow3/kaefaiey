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

// providers/movielinkdb/episodes.ts
var episodes_exports = {};
__export(episodes_exports, {
  getEpisodes: () => getEpisodes
});

var headers = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Cache-Control": "no-store",
  "Accept-Language": "en-US,en;q=0.9",
  DNT: "1",
  "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  Cookie: "xla=s4t; _ga=GA1.1.1081149560.1756378968; _ga_BLZGKYN5PF=GS2.1.s1756378968$o1$g1$t1756378984$j44$l0$h0",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
};
function base64ToBinary(b64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = b64.replace(/=+$/, "").replace(/[^A-Za-z0-9+/]/g, "");
  let out = "";
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    const idx = chars.indexOf(clean[i]);
    if (idx < 0) continue;
    buffer = buffer << 6 | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode(buffer >> bits & 255);
    }
  }
  return out;
}
__name(base64ToBinary, "base64ToBinary");
function decodeDownloadLink(encoded, seedHex, rounds) {
  try {
    let x = parseInt(seedHex, 16) >>> 0 || 0;
    const r = Math.max(0, rounds | 0);
    for (let i = 0; i < r; i++) {
      x = Math.imul(x, 1103515245) + 12345 >>> 0;
    }
    const raw = base64ToBinary(encoded);
    let out = "";
    for (let j = 0; j < raw.length; j++) {
      x = Math.imul(x, 1103515245) + 12345 >>> 0;
      const key = x >>> 16 & 255;
      out += String.fromCharCode(raw.charCodeAt(j) ^ key);
    }
    return out;
  } catch (e) {
    return "";
  }
}
__name(decodeDownloadLink, "decodeDownloadLink");
function resolveUrl(href, baseUrl) {
  if (!href) return "";
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith("//")) return "https:" + href;
  try {
    return new URL(href, baseUrl).href;
  } catch (e) {
    return `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`;
  }
}
__name(resolveUrl, "resolveUrl");
var getEpisodes = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    url,
    providerContext
  }) {
    const { axios, cheerio } = providerContext;
    console.log("[getEpisodes] Fetching:", url);
    let baseUrl = "";
    try {
      baseUrl = new URL(url).origin;
    } catch (e) {
      baseUrl = "";
    }
    try {
      const res = yield axios.get(url, {
        headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl })
      });
      const $ = cheerio.load(res.data || "");
      let pageType = "series";
      if (/\/anime\//i.test(url)) pageType = "anime";
      else if (/\/drama\//i.test(url)) pageType = "drama";
      else if (/\/series\//i.test(url)) pageType = "series";
      const collected = [];
      $("#mlbdEpisodeDownloadGrid .ep-card").each((_, element) => {
        const $card = $(element);
        let epTitle = $card.find(".mlbd-episode-title").first().text().trim();
        if (!epTitle) {
          const epAttr = String($card.attr("data-episode-number") || "").trim();
          epTitle = epAttr ? `Episode ${epAttr}` : "Episode";
        }
        const seasonNum = String($card.attr("data-season-number") || "").trim();
        const epNumRaw = String($card.attr("data-episode-number") || "").trim();
        const epNum = epNumRaw ? parseInt(epNumRaw, 10) || 999 : 999;
        $card.find("a.mlbd-episode-download-btn, a[data-dl]").each(
          (__, a) => {
            const $a = $(a);
            const dataDl = ($a.attr("data-dl") || "").trim();
            const dataDs = ($a.attr("data-ds") || "0").trim();
            const dataDr = parseInt($a.attr("data-dr") || "0", 10) || 0;
            if (!dataDl) return;
            const decoded = decodeDownloadLink(dataDl, dataDs, dataDr);
            if (!decoded) return;
            const directUrl = resolveUrl(decoded, baseUrl);
            const buttonText = $a.find(".btn-text").text().trim();
            const qualityMatch = buttonText.match(/(\d+p)/i);
            const sizeMatch = buttonText.match(/•\s*([\d.]+)\s*(GB|MB)/i);
            const quality = qualityMatch ? qualityMatch[1].toLowerCase() : "";
            const size = sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2]}` : "";
            collected.push({
              title: epTitle,
              link: directUrl,
              seasonNum,
              epNum,
              quality,
              size,
              sortOrder: collected.length
            });
          }
        );
      });
      const qualitySortKey = /* @__PURE__ */ __name((q) => {
        const m = q.match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 9999;
      }, "qualitySortKey");
      collected.sort((a, b) => {
        if (a.seasonNum !== b.seasonNum)
          return Number(a.seasonNum || 0) - Number(b.seasonNum || 0);
        if (a.epNum !== b.epNum) return a.epNum - b.epNum;
        const qa = qualitySortKey(a.quality);
        const qb = qualitySortKey(b.quality);
        if (qa !== qb) return qa - qb;
        return a.sortOrder - b.sortOrder;
      });
      const episodes = collected.map((ep) => {
        const prefix = ep.seasonNum ? `S${ep.seasonNum} \u2022 ${ep.title}` : ep.title;
        const title = `${prefix}${ep.quality ? ` \u2022 ${ep.quality}` : ""}${ep.size ? ` [${ep.size}]` : ""}`;
        return { title, link: ep.link };
      });
      const bundleEntries = [];
      $(".mlbd-download-button-wrap").each((_, element) => {
        const anchor = $(element).find("a").first();
        if (!anchor.length) return;
        const dataDl = (anchor.attr("data-dl") || "").trim();
        const dataDs = (anchor.attr("data-ds") || "0").trim();
        const dataDr = parseInt(anchor.attr("data-dr") || "0", 10) || 0;
        const plainHref = (anchor.attr("href") || "").trim();
        let directUrl = "";
        if (dataDl) {
          const decoded = decodeDownloadLink(dataDl, dataDs, dataDr);
          if (decoded) directUrl = resolveUrl(decoded, baseUrl);
        } else if (plainHref && plainHref !== "#") {
          directUrl = resolveUrl(plainHref, baseUrl);
        }
        if (!directUrl) return;
        const buttonText = anchor.find(".btn-text").text().trim();
        const qualityMatch = buttonText.match(/(\d+p)/i);
        const sizeMatch = buttonText.match(/•\s*([\d.]+)\s*(GB|MB)/i);
        const quality = qualityMatch ? qualityMatch[1].toLowerCase() : "";
        const size = sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2]}` : "";
        const title = `Complete Series${quality ? ` \u2022 ${quality}` : ""}${size ? ` [${size}]` : ""}`;
        bundleEntries.push({ title, link: directUrl });
      });
      const allEpisodes = [...bundleEntries, ...episodes];
      console.log(
        `[getEpisodes] Found ${allEpisodes.length} entr${allEpisodes.length === 1 ? "y" : "ies"} (type=${pageType})`
      );
      return allEpisodes;
    } catch (err) {
      console.error("[getEpisodes] Error:", (err == null ? void 0 : err.message) || err);
      return [];
    }
  });
}, "getEpisodes");
exports.getEpisodes = getEpisodes;
// Annotate the CommonJS export names for ESM import in node:

