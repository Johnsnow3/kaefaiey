"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// providers/kickAssAnime/catalog.ts
var catalog_exports = {};
__export(catalog_exports, {
  catalog: () => catalog,
  genres: () => genres
});

var catalog = [
  { title: "Trending", filter: "/api/show/trending" },
  { title: "Popular", filter: "/api/show/popular" },
  { title: "Recent (Sub)", filter: "/api/show/recent?type=sub" },
  { title: "Recent (Dub)", filter: "/api/show/recent?type=dub" },
  { title: "Recent (Chinese)", filter: "/api/show/recent?type=chinese" },
  { title: "All Anime", filter: "/api/anime" }
];
var genres = [
  { title: "Action", filter: "Action" },
  { title: "Adventure", filter: "Adventure" },
  { title: "Comedy", filter: "Comedy" },
  { title: "Drama", filter: "Drama" },
  { title: "Ecchi", filter: "Ecchi" },
  { title: "Fantasy", filter: "Fantasy" },
  { title: "Horror", filter: "Horror" },
  { title: "Mahou Shoujo", filter: "Mahou Shoujo" },
  { title: "Mecha", filter: "Mecha" },
  { title: "Music", filter: "Music" },
  { title: "Mystery", filter: "Mystery" },
  { title: "Psychological", filter: "Psychological" },
  { title: "Romance", filter: "Romance" },
  { title: "Sci-Fi", filter: "Sci-Fi" },
  { title: "Slice of Life", filter: "Slice of Life" },
  { title: "Sports", filter: "Sports" },
  { title: "Supernatural", filter: "Supernatural" },
  { title: "Suspense", filter: "Suspense" },
  { title: "Thriller", filter: "Thriller" }
];
exports.catalog = catalog;
exports.genres = genres;
// Annotate the CommonJS export names for ESM import in node:

