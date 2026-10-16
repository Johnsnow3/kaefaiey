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

// providers/animeworld/episodes.ts
var episodes_exports = {};
__export(episodes_exports, {
  getEpisodes: () => getEpisodes
});

var headers = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
};
var getEpisodes = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    url,
    providerContext
  }) {
    var _a;
    const { axios, cheerio } = providerContext;
    let pageUrl = url;
    let targetSeason = 0;
    let isMovie = false;
    if (url.startsWith("watchanimeworld://movie")) {
      try {
        const u = new URL(url);
        pageUrl = decodeURIComponent(u.searchParams.get("url") || "");
        isMovie = true;
      } catch (e) {
        console.log("getEpisodes: failed to parse movie URL", e);
        return [];
      }
    } else if (url.startsWith("watchanimeworld://season")) {
      try {
        const u = new URL(url);
        pageUrl = decodeURIComponent(u.searchParams.get("url") || "");
        targetSeason = parseInt(u.searchParams.get("season") || "0", 10);
      } catch (e) {
        console.log("getEpisodes: failed to parse season URL", e);
        return [];
      }
    } else {
      if (url.includes("/movies/") || url.includes("/movie/")) {
        isMovie = true;
        pageUrl = url;
      }
    }
    if (!pageUrl) {
      console.log("getEpisodes: missing page URL");
      return [];
    }
    console.log(
      `getEpisodes: fetching ${pageUrl}, ${isMovie ? "MOVIE" : `season: ${targetSeason || "all"}`}`
    );
    try {
      const res = yield axios.get(pageUrl, { headers });
      const $ = cheerio.load(res.data);
      const origin = new URL(pageUrl).origin;
      if (isMovie) {
        const movieLinks = [];
        const SERVER_SELECTORS = [
          ".server-list li a",
          ".servers-list li a",
          "ul#player-list li a",
          ".mirror",
          ".play-button a",
          ".player-options li a",
          ".options-list li a"
        ];
        SERVER_SELECTORS.forEach((sel) => {
          $(sel).each((_, el) => {
            var _a2;
            const href = $(el).attr("href") || $(el).attr("data-url") || "";
            if (!href) return;
            const full = href.startsWith("http") ? href : new URL(href, pageUrl).href;
            if (full === pageUrl || full.endsWith("#")) return;
            const label = $(el).text().trim() || ((_a2 = $(el).attr("title")) == null ? void 0 : _a2.trim()) || "Play Movie";
            if (!movieLinks.find((m) => m.link === full)) {
              movieLinks.push({ title: label, link: full });
            }
          });
        });
        if (movieLinks.length === 0) {
          movieLinks.push({
            title: "Play",
            link: pageUrl
          });
        }
        console.log(`getEpisodes: found ${movieLinks.length} movie links`);
        return movieLinks;
      }
      const postId = $(".choose-season .aa-cnt li a[data-post]").first().attr("data-post") || ((_a = $("article.post").attr("id")) == null ? void 0 : _a.replace("post-", "")) || "";
      let episodes = [];
      if (postId && targetSeason) {
        try {
          const ajaxUrl = `${origin}/wp-admin/admin-ajax.php`;
          const form = new URLSearchParams();
          form.append("action", "action_select_season");
          form.append("post", postId);
          form.append("season", String(targetSeason));
          const ajaxRes = yield axios.post(ajaxUrl, form.toString(), {
            headers: __spreadProps(__spreadValues({}, headers), {
              "Content-Type": "application/x-www-form-urlencoded",
              Referer: pageUrl,
              "X-Requested-With": "XMLHttpRequest"
            })
          });
          let ajaxHtml = "";
          const data = ajaxRes.data;
          if (typeof data === "string") {
            ajaxHtml = data;
          } else if (data && typeof data === "object") {
            ajaxHtml = data.data || data.html || data.episodes || "";
            if (typeof ajaxHtml !== "string") ajaxHtml = "";
          }
          if (ajaxHtml.trim()) {
            const $$ = cheerio.load(ajaxHtml);
            $$("li").each((_, el) => {
              const $li = $$(el);
              const article = $li.find("article.episodes");
              const $art = article.length ? article : $li;
              const href = $art.find("a.lnk-blk").attr("href") || $art.find("a").first().attr("href");
              if (!href) return;
              const numEpi = $art.find(".num-epi").text().trim();
              const match = numEpi.match(/(\d+)x(\d+)/);
              if (!match) return;
              const season = parseInt(match[1], 10);
              const epNum = parseInt(match[2], 10);
              if (targetSeason && season !== targetSeason) return;
              episodes.push({
                title: `Episode ${epNum}`,
                link: href.startsWith("http") ? href : new URL(href, pageUrl).href
              });
            });
          }
        } catch (ajaxErr) {
          console.log("getEpisodes: AJAX attempt failed:", ajaxErr);
        }
      }
      if (episodes.length === 0) {
        $("#episode_by_temp li").each((_, el) => {
          const article = $(el).find("article.episodes");
          if (!article.length) return;
          const href = article.find("a.lnk-blk").attr("href");
          if (!href) return;
          const numEpi = article.find(".num-epi").text().trim();
          const match = numEpi.match(/(\d+)x(\d+)/);
          if (!match) return;
          const season = parseInt(match[1], 10);
          const epNum = parseInt(match[2], 10);
          if (targetSeason && season !== targetSeason) return;
          episodes.push({
            title: `Episode ${epNum}`,
            link: href.startsWith("http") ? href : new URL(href, pageUrl).href
          });
        });
      }
      episodes.sort((a, b) => {
        var _a2, _b;
        const na = parseInt(((_a2 = a.title.match(/\d+/)) == null ? void 0 : _a2[0]) || "0", 10);
        const nb = parseInt(((_b = b.title.match(/\d+/)) == null ? void 0 : _b[0]) || "0", 10);
        return na - nb;
      });
      console.log(
        `getEpisodes: found ${episodes.length} episodes for season ${targetSeason}`
      );
      return episodes;
    } catch (err) {
      console.log("getEpisodes error:", err);
      return [];
    }
  });
}, "getEpisodes");
exports.getEpisodes = getEpisodes;
// Annotate the CommonJS export names for ESM import in node:

