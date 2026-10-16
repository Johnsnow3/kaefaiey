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

// providers/anikoto/meta.ts
var meta_exports = {};
__export(meta_exports, {
  getMeta: () => getMeta
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

// providers/anikoto/meta.ts
var BASE_URL = "https://anikototv.to";
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
function encodeVrf(animeId) {
  const encrypted = rc4("simple-hash", animeId);
  return encodeBase64(encrypted);
}
__name(encodeVrf, "encodeVrf");
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b;
    try {
      const { axios, cheerio } = providerContext;
      let watchUrl = link;
      if (!watchUrl.startsWith("http")) {
        watchUrl = `${BASE_URL}${watchUrl.startsWith("/") ? "" : "/"}${watchUrl}`;
      }
      if (!watchUrl.includes("/ep-")) {
        watchUrl = `${watchUrl.replace(/\/+$/, "")}/ep-1`;
      }
      const slug = watchUrl.replace(BASE_URL, "").replace(/^\/watch\//, "").split("/")[0];
      const res = yield axios.get(watchUrl, {
        headers: __spreadProps(__spreadValues({}, providerContext.commonHeaders), {
          Referer: `${BASE_URL}/`
        })
      });
      const $ = cheerio.load(res.data);
      const title = $("h1.title").text().trim() || $(".binfo h1").text().trim() || slug;
      const synopsis = $("div.synopsis div.content").text().trim() || $("div.synopsis").text().trim() || "";
      const image = $("#w-info .poster img, .poster img").first().attr("src") || $("img").first().attr("src") || "";
      const rating = $("[itemprop='ratingValue']").first().text().trim() || ((_a = $(".meta div:contains('MAL'), #w-info div:contains('MAL')").first().text().match(/MAL:\s*(\d+(?:\.\d+)?)/)) == null ? void 0 : _a[1]) || ((_b = $(".score .value").text().match(/\d+(?:\.\d+)?/)) == null ? void 0 : _b[0]) || void 0;
      const tags = [];
      $("div:contains(Genres) span a, .genre a").each((_, el) => {
        const g = $(el).text().trim();
        if (g && !tags.includes(g)) tags.push(g);
      });
      const typeText = $(".meta div:contains(Type) span, .m-item span").first().text().trim().toLowerCase();
      const type = typeText.includes("movie") ? "movie" : "series";
      const animeId = $("#watch-page, #watch-main, .watch-wrap, [data-id]").first().attr("data-id");
      const linkList = [];
      if (animeId) {
        const vrf = encodeURIComponent(encodeVrf(animeId));
        const epAjaxUrl = `${BASE_URL}/ajax/episode/list/${animeId}?vrf=${vrf}&style=default`;
        const epRes = yield axios.get(epAjaxUrl, {
          headers: __spreadProps(__spreadValues({}, providerContext.commonHeaders), {
            "X-Requested-With": "XMLHttpRequest",
            Referer: watchUrl
          })
        });
        if (epRes.data && epRes.data.status === 200 && epRes.data.result) {
          const $ep = cheerio.load(epRes.data.result);
          const epElements = $ep(
            "ul.ep-range a, .ep-range a, .range a, a[data-ids]"
          );
          const directLinks = [];
          epElements.each((_, el) => {
            const num = $ep(el).attr("data-num") || "";
            if (!num) return;
            const dataIds = $ep(el).attr("data-ids") || "";
            const malId = $ep(el).attr("data-mal") || "";
            const timestamp = $ep(el).attr("data-timestamp") || "";
            const hasSub = $ep(el).attr("data-sub") === "1";
            const hasDub = $ep(el).attr("data-dub") === "1";
            let epTitle = $ep(el).attr("title") || `Episode ${num}`;
            directLinks.push({
              title: epTitle,
              link: JSON.stringify({
                slug,
                epNum: num,
                dataIds,
                malId,
                timestamp,
                hasSub,
                hasDub,
                title: epTitle
              })
            });
          });
          if (directLinks.length > 0) {
            linkList.push({
              title,
              directLinks
            });
          }
        }
      }
      if (linkList.length === 0) {
        linkList.push({
          title,
          directLinks: [
            {
              title: type === "movie" ? "Movie" : "Episode 1",
              link: JSON.stringify({
                slug,
                epNum: "1",
                dataIds: "",
                malId: "",
                timestamp: "",
                hasSub: true,
                hasDub: false,
                title
              }),
              type
            }
          ]
        });
      }
      return {
        title,
        synopsis,
        image,
        imdbId: "",
        type,
        tags: tags.length > 0 ? tags : void 0,
        rating,
        linkList,
        webUrl: watchUrl
      };
    } catch (err) {
      throwProviderError("Anikoto", "metadata", err);
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

