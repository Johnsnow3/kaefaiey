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

// providers/a111477/meta.ts
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

// providers/a111477/meta.ts
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    try {
      const { axios, cheerio } = providerContext;
      const url = link;
      const res = yield axios.get(url);
      const data = res.data;
      const $ = cheerio.load(data);
      const urlTitle = decodeURIComponent(
        new URL(url).pathname.split("/").filter(Boolean).pop() || ""
      );
      const heading = $("h1").text().trim().replace(/^Index of\s*/i, "");
      const title = heading && heading !== "/" ? heading.replace(/\/$/, "") : urlTitle;
      const links = [];
      const directLinks = [];
      $("table tbody tr").each((i, element) => {
        const $row = $(element);
        const linkElement = $row.find("a[href]").first();
        const itemTitle = linkElement.text().trim();
        const itemLink = linkElement.attr("href");
        if (itemTitle && itemLink && itemTitle !== "../" && itemTitle !== "Parent Directory") {
          const fullLink = new URL(itemLink, url).href;
          if (itemTitle.endsWith("/")) {
            const cleanTitle = itemTitle.replace(/\/$/, "");
            links.push({
              episodesLink: fullLink,
              title: cleanTitle
            });
          } else if (itemTitle.includes(".mp4") || itemTitle.includes(".mkv") || itemTitle.includes(".avi") || itemTitle.includes(".mov")) {
            directLinks.push({
              title: itemTitle,
              link: fullLink
            });
          }
        }
      });
      if (directLinks.length > 0) {
        links.push({
          title: title + " (Direct Files)",
          directLinks
        });
      }
      const pathname = new URL(url).pathname;
      const type = pathname.startsWith("/tvs/") || pathname.startsWith("/kdrama/") || pathname.startsWith("/asiandrama/") || links.some((item) => item.episodesLink) ? "series" : "movie";
      return {
        title,
        synopsis: `Content from 111477.xyz directory`,
        image: `https://placehold.jp/23/000000/ffffff/300x450.png?text=${encodeURIComponent(
          title
        )}&css=%7B%22background%22%3A%22%20-webkit-gradient(linear%2C%20left%20bottom%2C%20left%20top%2C%20from(%233f3b3b)%2C%20to(%23000000))%22%2C%22text-transform%22%3A%22%20capitalize%22%7D`,
        imdbId: "",
        type,
        linkList: links
      };
    } catch (err) {
      throwProviderError("111477", "metadata", err);
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

