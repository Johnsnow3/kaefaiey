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

// providers/kickAssAnime/meta.ts
var meta_exports = {};
__export(meta_exports, {
  getMeta: () => getMeta
});

var BASE_URL = "https://kaa.lt";
var headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*"
};
function formatPoster(poster) {
  if (!poster) return "";
  if (poster.hq) return `${BASE_URL}/image/poster/${poster.hq}.webp`;
  if (poster.sm) return `${BASE_URL}/image/poster/${poster.sm}.webp`;
  if (poster.url) return poster.url.startsWith("http") ? poster.url : `${BASE_URL}/${poster.url}`;
  return "";
}
__name(formatPoster, "formatPoster");
function formatThumbnail(thumbnail) {
  if (!thumbnail) return void 0;
  if (thumbnail.hq) return `${BASE_URL}/image/thumbnail/${thumbnail.hq}.webp`;
  if (thumbnail.sm) return `${BASE_URL}/image/thumbnail/${thumbnail.sm}.webp`;
  if (thumbnail.url) return thumbnail.url.startsWith("http") ? thumbnail.url : `${BASE_URL}/${thumbnail.url}`;
  return void 0;
}
__name(formatThumbnail, "formatThumbnail");
function getLangLabel(lang) {
  if (lang === "ja-JP") return "Sub";
  if (lang === "en-US") return "Dub";
  if (lang === "es-419" || lang === "es-ES") return "Spanish";
  if (lang === "ko-KR") return "Korean";
  if (lang === "zh-CN") return "Chinese";
  return lang;
}
__name(getLangLabel, "getLangLabel");
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c, _d;
    const { axios } = providerContext;
    const slug = link.replace(/^https?:\/\/[^/]+\//, "").replace(/^\//, "").split("/")[0];
    const detailRes = yield axios.get(`${BASE_URL}/api/show/${slug}`, { headers });
    const data = detailRes.data || {};
    const title = data.title_en || data.title || slug;
    const synopsis = data.synopsis || "";
    const image = formatPoster(data.poster);
    const type = data.type === "movie" ? "movie" : "series";
    let languages = ["ja-JP"];
    try {
      const langRes = yield axios.get(`${BASE_URL}/api/show/${slug}/language`, { headers });
      if (Array.isArray((_a = langRes.data) == null ? void 0 : _a.result) && langRes.data.result.length > 0) {
        languages = langRes.data.result;
      }
    } catch (e) {
    }
    const linkList = [];
    for (const lang of languages) {
      try {
        const epRes = yield axios.get(`${BASE_URL}/api/show/${slug}/episodes?page=1&lang=${lang}`, {
          headers
        });
        let episodes = ((_b = epRes.data) == null ? void 0 : _b.result) || [];
        const pages = ((_c = epRes.data) == null ? void 0 : _c.pages) || [];
        if (pages.length > 1) {
          const remainingPages = yield Promise.all(
            pages.slice(1).map(
              (_, idx) => axios.get(`${BASE_URL}/api/show/${slug}/episodes?page=${idx + 2}&lang=${lang}`, { headers }).then((r) => {
                var _a2;
                return ((_a2 = r.data) == null ? void 0 : _a2.result) || [];
              }).catch(() => [])
            )
          );
          episodes = episodes.concat(remainingPages.flat());
        }
        if (episodes.length > 0) {
          if (lang !== "ja-JP") {
            try {
              const firstEp = episodes[0];
              const checkRes = yield axios.get(
                `${BASE_URL}/api/show/${slug}/episode/ep-${firstEp.episode_string}-${firstEp.slug}`,
                { headers }
              );
              if (!((_d = checkRes.data) == null ? void 0 : _d.servers) || checkRes.data.servers.length === 0) {
                continue;
              }
            } catch (e) {
            }
          }
          const directLinks = episodes.map((ep) => {
            const epTitle = `Episode ${ep.episode_string}${ep.title ? ` - ${ep.title}` : ""}`;
            return {
              title: epTitle,
              link: JSON.stringify({
                slug,
                epSlug: ep.slug,
                epNum: ep.episode_string,
                lang
              }),
              type,
              image: formatThumbnail(ep.thumbnail)
            };
          });
          const langLabel = getLangLabel(lang);
          linkList.push({
            title: languages.length > 1 ? `Episodes (${langLabel})` : "Episodes",
            directLinks
          });
        }
      } catch (e) {
      }
    }
    return {
      title,
      synopsis,
      image,
      imdbId: "",
      type,
      linkList,
      webUrl: `${BASE_URL}/${slug}`
    };
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

