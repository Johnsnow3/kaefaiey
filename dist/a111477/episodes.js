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

// providers/a111477/episodes.ts
var episodes_exports = {};
__export(episodes_exports, {
  getEpisodes: () => getEpisodes
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

// providers/a111477/episodes.ts
var getEpisodes = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    url,
    providerContext
  }) {
    const { axios, cheerio } = providerContext;
    try {
      const res = yield axios.get(url);
      const html = res.data;
      const $ = cheerio.load(html);
      const episodeLinks = [];
      $("table tbody tr").each((i, element) => {
        const $row = $(element);
        const linkElement = $row.find("a[href]").first();
        const fileName = linkElement.text().trim();
        const fileLink = linkElement.attr("href");
        if (fileName && fileLink && fileName !== "../" && fileName !== "Parent Directory") {
          if (fileName.includes(".mp4") || fileName.includes(".mkv") || fileName.includes(".avi") || fileName.includes(".mov")) {
            const fullLink = new URL(fileLink, url).href;
            let episodeTitle = fileName;
            const episodeMatch = fileName.match(/[Ss](\d+)[Ee](\d+)/);
            const simpleEpisodeMatch = fileName.match(/[Ee](\d+)/);
            if (episodeMatch) {
              episodeTitle = `S${episodeMatch[1]}E${episodeMatch[2]} - ${fileName}`;
            } else if (simpleEpisodeMatch) {
              episodeTitle = `Episode ${simpleEpisodeMatch[1]} - ${fileName}`;
            } else {
              const numberMatch = fileName.match(/(\d+)/);
              if (numberMatch) {
                episodeTitle = `Episode ${numberMatch[1]} - ${fileName}`;
              }
            }
            episodeLinks.push({
              title: episodeTitle,
              link: fullLink
            });
          }
        }
      });
      return episodeLinks;
    } catch (err) {
      throwProviderError("111477", "episodes", err);
    }
  });
}, "getEpisodes");
exports.getEpisodes = getEpisodes;
// Annotate the CommonJS export names for ESM import in node:

