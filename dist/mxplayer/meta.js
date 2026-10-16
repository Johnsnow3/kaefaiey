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

// providers/mxplayer/meta.ts
var meta_exports = {};
__export(meta_exports, {
  getMeta: () => getMeta
});

var defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.mxplayer.in/"
};
var IMAGE_URL = "https://qqcdnpictest.mxplay.com/";
function formatImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${IMAGE_URL}${url.replace(/^\/+/, "")}`;
}
__name(formatImageUrl, "formatImageUrl");
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c, _d, _e;
    const { axios, cheerio } = providerContext;
    try {
      const res = yield axios.get(link, { headers: defaultHeaders });
      const $ = cheerio.load(res.data);
      let mxsEntity = null;
      $("script").each((_, el) => {
        var _a2;
        const text = $(el).html() || "";
        if (text.includes("window.__mxs__")) {
          try {
            const jsonText = text.replace(/^window\.__mxs__\s*=\s*/, "").replace(/;?\s*$/, "");
            const parsed = JSON.parse(jsonText);
            const entities = (parsed == null ? void 0 : parsed.entities) || {};
            const matchId = (_a2 = link.match(
              /\/detail\/(?:movie|tvshow|show)\/([a-zA-Z0-9_-]+)/i
            )) == null ? void 0 : _a2[1];
            mxsEntity = matchId && entities[matchId] || Object.values(entities)[0];
          } catch (e) {
          }
        }
      });
      let image = "";
      if (mxsEntity) {
        const bannerImg = (_a = mxsEntity.titleContentImageInfo) == null ? void 0 : _a.find(
          (i) => {
            var _a2, _b2;
            return i.type === "banner_and_static_bg_desktop" || i.width >= 1280 || ((_a2 = i.url) == null ? void 0 : _a2.includes("1600x900")) || ((_b2 = i.url) == null ? void 0 : _b2.includes("1280x720"));
          }
        );
        if (bannerImg == null ? void 0 : bannerImg.url) {
          image = formatImageUrl(bannerImg.url);
        }
        if (!image) {
          const bigPic = (_b = mxsEntity.imageInfo) == null ? void 0 : _b.find(
            (i) => {
              var _a2;
              return i.type === "bigpic" || i.width >= 640 || i.type === "landscape" || ((_a2 = i.url) == null ? void 0 : _a2.includes("16x9"));
            }
          );
          if (bigPic == null ? void 0 : bigPic.url) {
            image = formatImageUrl(bigPic.url);
          }
        }
      }
      if (!image) {
        const ogImage = $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content") || "";
        if (ogImage) {
          image = ogImage.includes("/320x180/") ? ogImage.replace("/320x180/", "/640x360/") : ogImage;
        }
      }
      let poster = "";
      if (mxsEntity) {
        const portrait = (_c = mxsEntity.imageInfo) == null ? void 0 : _c.find(
          (i) => {
            var _a2, _b2;
            return i.type === "portrait_large" || i.type === "portrait" || ((_a2 = i.url) == null ? void 0 : _a2.includes("2x3")) || ((_b2 = i.url) == null ? void 0 : _b2.includes("320x480"));
          }
        );
        if (portrait == null ? void 0 : portrait.url) {
          poster = formatImageUrl(portrait.url);
        }
      }
      let logo = void 0;
      if (mxsEntity) {
        const logoImg = (_d = mxsEntity.titleContentImageInfo) == null ? void 0 : _d.find(
          (i) => {
            var _a2;
            return i.type === "title_desktop" || ((_a2 = i.type) == null ? void 0 : _a2.includes("title"));
          }
        );
        if (logoImg == null ? void 0 : logoImg.url) {
          logo = formatImageUrl(logoImg.url);
        }
      }
      const title = (mxsEntity == null ? void 0 : mxsEntity.title) || $("h1").first().text().trim() || $('meta[property="og:title"]').attr("content") || "";
      const synopsis = (mxsEntity == null ? void 0 : mxsEntity.description) || $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || $(".description").text().trim() || "";
      const rating = (mxsEntity == null ? void 0 : mxsEntity.rating) ? String(mxsEntity.rating) : void 0;
      const tags = (mxsEntity == null ? void 0 : mxsEntity.genres) || void 0;
      const cast = (_e = mxsEntity == null ? void 0 : mxsEntity.contributors) == null ? void 0 : _e.map((c) => c.name).filter(Boolean);
      let type = "movie";
      if ((mxsEntity == null ? void 0 : mxsEntity.type) === "tvshow" || (mxsEntity == null ? void 0 : mxsEntity.type) === "show" || link.includes("/tvshow/") || link.includes("/show/")) {
        type = "series";
      }
      const linkList = [];
      const seasonTabs = $("div.hs__items-container > div");
      if (seasonTabs.length > 0) {
        type = "series";
        seasonTabs.each((_, el) => {
          const tabId = $(el).attr("data-id");
          const tabText = $(el).text().trim();
          const tabIndex = $(el).attr("data-tab");
          if (tabId) {
            const seasonTitle = tabText || (tabIndex ? `Season ${tabIndex}` : "Season 1");
            linkList.push({
              title: seasonTitle,
              quality: "Standard",
              episodesLink: tabId,
              directLinks: []
            });
          }
        });
      }
      if (type === "movie" || linkList.length === 0) {
        linkList.push({
          title: "Movie",
          quality: "Default",
          episodesLink: link,
          directLinks: []
        });
      }
      return {
        title,
        synopsis,
        image,
        poster: poster || void 0,
        logo,
        imdbId: "",
        type,
        tags,
        cast,
        rating,
        linkList,
        webUrl: link
      };
    } catch (err) {
      console.error("MXPlayer Meta Error", err);
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

