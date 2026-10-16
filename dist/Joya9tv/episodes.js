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

// providers/Joya9tv/episodes.ts
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

// providers/Joya9tv/episodes.ts
var getEpisodes = /* @__PURE__ */ __name(function({
  url,
  providerContext
}) {
  const { axios, cheerio, commonHeaders: headers } = providerContext;
  console.log("getEpisodeLinks", url);
  return axios.get(url, { headers }).then((res) => {
    var _a;
    const $ = cheerio.load(res.data);
    const container = $("ul:has(p.font-bold:contains('Episode'))").first();
    const episodes = [];
    container.find("p.font-bold").each((_, element) => {
      const el = $(element);
      let title = el.text().trim();
      if (!title) return;
      let currentElement = el.parent();
      while (currentElement.next().length && !currentElement.next().find("p.font-bold").length) {
        currentElement = currentElement.next();
        currentElement.find("a[href]").each((_2, a) => {
          var _a2;
          const anchor = $(a);
          const href = (_a2 = anchor.attr("href")) == null ? void 0 : _a2.trim();
          if (href && (href.includes("hubcloud") || href.includes("gdflix") || href.includes("cloud") || href.includes("dotlink") || href.includes("vcloud") || href.includes("filepress") || href.includes("multicloud"))) {
            episodes.push({
              title: title.replace(/ Links$/i, ""),
              link: href
            });
          }
        });
      }
    });
    return (_a = providerContext.kvStore) == null ? void 0 : _a.get("Joya9tv_quickDownload").then((quickDownload) => {
      return episodes.map((e) => __spreadProps(__spreadValues({}, e), {
        quickDownload: quickDownload != null ? quickDownload : true
      }));
    });
  }).catch((err) => {
    throwProviderError("Joya9TV", "episodes", err);
  });
}, "getEpisodes");
exports.getEpisodes = getEpisodes;
// Annotate the CommonJS export names for ESM import in node:

