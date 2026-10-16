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

// providers/mxplayer/posts.ts
var posts_exports = {};
__export(posts_exports, {
  getPosts: () => getPosts,
  getSearchPosts: () => getSearchPosts
});

var MAIN_URL = "https://www.mxplayer.in";
var API_URL = "https://api.mxplayer.in/v1/web";
var IMAGE_URL = "https://qqcdnpictest.mxplay.com/";
var defaultHeaders = {
  Referer: `${MAIN_URL}/`,
  Origin: MAIN_URL,
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};
function getUserID(axios) {
  return __async(this, null, function* () {
    try {
      const res = yield axios.get(MAIN_URL, { headers: defaultHeaders });
      const cookies = res.headers["set-cookie"];
      if (cookies) {
        for (const c of cookies) {
          if (c.includes("UserID=")) {
            const match = c.match(/UserID=([^;]+)/);
            return match ? match[1] : "";
          }
        }
      }
      return "";
    } catch (e) {
      return "";
    }
  });
}
__name(getUserID, "getUserID");
var getEndParam = /* @__PURE__ */ __name((userId) => `&device-density=2&userid=${userId}&platform=com.mxplay.desktop&content-languages=hi,en&kids-mode-enabled=false`, "getEndParam");
function getPosts(_0) {
  return __async(this, arguments, function* ({
    filter,
    page = 1,
    providerContext
  }) {
    var _a;
    const { axios } = providerContext;
    const userId = yield getUserID(axios);
    const endParam = getEndParam(userId);
    const queryParams = filter || "browseLangFilterIds=hi&type=1";
    const url = `${API_URL}/detail/browseItem?pageNum=${page}&pageSize=20&isCustomized=true&${queryParams}${endParam}`;
    try {
      const res = yield axios.get(url, { headers: defaultHeaders });
      const items = ((_a = res.data) == null ? void 0 : _a.items) || [];
      return items.map((item) => mapItemToPost(item));
    } catch (err) {
      console.error("MPlayer getPosts error", err);
      return [];
    }
  });
}
__name(getPosts, "getPosts");
function getSearchPosts(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    providerContext
  }) {
    var _a;
    const { axios } = providerContext;
    const userId = yield getUserID(axios);
    const endParam = getEndParam(userId);
    const url = `${API_URL}/search/resultv2?query=${encodeURIComponent(searchQuery)}${endParam}`;
    try {
      const res = yield axios.post(url, {}, { headers: defaultHeaders });
      const sections = ((_a = res.data) == null ? void 0 : _a.sections) || [];
      const posts = [];
      for (const section of sections) {
        const items = section.items || [];
        for (const item of items) {
          posts.push(mapItemToPost(item));
        }
      }
      return posts;
    } catch (err) {
      console.error("MPlayer search error", err);
      return [];
    }
  });
}
__name(getSearchPosts, "getSearchPosts");
function mapItemToPost(item) {
  var _a;
  let image = "";
  if (item.imageInfo) {
    const portrait = item.imageInfo.find((i) => i.type === "portrait_large");
    if (portrait && portrait.url) {
      image = IMAGE_URL + portrait.url;
    } else {
      image = ((_a = item.imageInfo[0]) == null ? void 0 : _a.url) ? IMAGE_URL + item.imageInfo[0].url : "";
    }
  }
  return {
    title: item.title || "",
    image,
    // We use the shareUrl as the link, or build a web link. 
    // Kotlin passes the whole JSON, but here we pass the URL to be scraped in meta.
    link: item.shareUrl ? `${MAIN_URL}${item.shareUrl}` : ""
  };
}
__name(mapItemToPost, "mapItemToPost");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

