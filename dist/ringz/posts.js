"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
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

// providers/ringz/posts.ts
var posts_exports = {};
__export(posts_exports, {
  getPosts: () => getPosts,
  getRingzAdult: () => getRingzAdult,
  getRingzAnime: () => getRingzAnime,
  getRingzMovies: () => getRingzMovies,
  getRingzShows: () => getRingzShows,
  getSearchPosts: () => getSearchPosts,
  headers: () => headers,
  ringzData: () => ringzData
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

// providers/ringz/posts.ts
var getPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    filter,
    signal,
    providerContext
  }) {
    return posts({ filter, signal, providerContext });
  });
}, "getPosts");
var getSearchPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    page
    // providerContext,
  }) {
    if (page > 1) return [];
    function searchData(data, query) {
      const searchQuery2 = query.toLowerCase();
      return data.filter((movie) => {
        const movieName = movie.mn.toLowerCase();
        return movieName.includes(searchQuery2);
      });
    }
    __name(searchData, "searchData");
    try {
      const catalog = [];
      const promises = [getRingzMovies(), getRingzShows(), getRingzAnime()];
      const responses = yield Promise.all(promises);
      responses.map((response) => {
        const searchResults = searchData(response, searchQuery);
        searchResults.map((element) => {
          const title = (element == null ? void 0 : element.kn) || (element == null ? void 0 : element.mn);
          const link = JSON.stringify(element);
          const image = element == null ? void 0 : element.IV;
          if (title && link) {
            catalog.push({
              title,
              link,
              image
            });
          }
        });
      });
      return catalog;
    } catch (err) {
      throwProviderError("Ringz", "search posts", err);
    }
  });
}, "getSearchPosts");
function posts(_0) {
  return __async(this, arguments, function* ({
    filter
    // signal,
  }) {
    try {
      let response;
      if (filter === "MOVIES") {
        response = getRingzMovies();
      }
      if (filter === "SERIES") {
        response = getRingzShows();
      }
      if (filter === "ANIME") {
        response = getRingzAnime();
      }
      const data = yield response;
      const catalog = [];
      data.map((element) => {
        const title = (element == null ? void 0 : element.kn) || (element == null ? void 0 : element.mn);
        const link = JSON.stringify(element);
        const image = element == null ? void 0 : element.IV;
        if (title && link) {
          catalog.push({
            title,
            link,
            image
          });
        }
      });
      return catalog;
    } catch (err) {
      throwProviderError("Ringz", "posts", err);
    }
  });
}
__name(posts, "posts");
var headers = {
  "cf-access-client-id": "833049b087acf6e787cedfd85d1ccdb8.access",
  "cf-access-client-secret": "02db296a961d7513c3102d7785df4113eff036b2d57d060ffcc2ba3ba820c6aa"
};
var BASE_URL = "https://privatereporz.pages.dev";
function getRingzMovies() {
  return __async(this, null, function* () {
    const url = `${BASE_URL}/test.json`;
    try {
      const response = yield fetch(url, {
        headers: __spreadValues({}, headers)
      });
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText} | URL ${url}`
        );
      }
      const data = yield response.json();
      return data.AllMovieDataList;
    } catch (error) {
      throwProviderError("Ringz", "fetch movies", error);
    }
  });
}
__name(getRingzMovies, "getRingzMovies");
function getRingzShows() {
  return __async(this, null, function* () {
    const url = `${BASE_URL}/srs.json`;
    try {
      const response = yield fetch(url, {
        headers: __spreadValues({}, headers)
      });
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText} | URL ${url}`
        );
      }
      const data = yield response.json();
      return data.webSeriesDataList;
    } catch (error) {
      throwProviderError("Ringz", "fetch shows", error);
    }
  });
}
__name(getRingzShows, "getRingzShows");
function getRingzAnime() {
  return __async(this, null, function* () {
    const url = `${BASE_URL}/anime.json`;
    try {
      const response = yield fetch(url, {
        headers: __spreadValues({}, headers)
      });
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText} | URL ${url}`
        );
      }
      const data = yield response.json();
      return data.webSeriesDataList;
    } catch (error) {
      throwProviderError("Ringz", "fetch anime", error);
    }
  });
}
__name(getRingzAnime, "getRingzAnime");
function getRingzAdult() {
  return __async(this, null, function* () {
    const url = `${BASE_URL}/desihub.json`;
    try {
      const response = yield fetch(url, {
        headers: __spreadValues({}, headers)
      });
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText} | URL ${url}`
        );
      }
      const data = yield response.json();
      return data.webSeriesDataList;
    } catch (error) {
      throwProviderError("Ringz", "fetch adult catalog", error);
    }
  });
}
__name(getRingzAdult, "getRingzAdult");
var ringzData = {
  getRingzMovies,
  getRingzShows,
  getRingzAnime,
  getRingzAdult
};
exports.getPosts = getPosts;
exports.getRingzAdult = getRingzAdult;
exports.getRingzAnime = getRingzAnime;
exports.getRingzMovies = getRingzMovies;
exports.getRingzShows = getRingzShows;
exports.getSearchPosts = getSearchPosts;
exports.headers = headers;
exports.ringzData = ringzData;
// Annotate the CommonJS export names for ESM import in node:

