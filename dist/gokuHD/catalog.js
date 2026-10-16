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

// providers/gokuHD/catalog.ts
var catalog_exports = {};
__export(catalog_exports, {
  catalog: () => catalog,
  genres: () => genres
});

var catalog = [
  { title: "Latest", filter: "" },
  { title: "Series", filter: "series" },
  { title: "Movies", filter: "movies" },
  { title: "Ongoing", filter: "ongoing-series" },
  { title: "Trending", filter: "trending" }
];
var genres = [
  { title: "Action", filter: "genres/action" },
  { title: "Adventure", filter: "genres/adventure" },
  { title: "Comedy", filter: "genres/comedy" },
  { title: "Fantasy", filter: "genres/fantasy" },
  { title: "Romance", filter: "genres/romance" },
  { title: "Sci-Fi", filter: "genres/sci%e2%80%91fi" }
];
exports.catalog = catalog;
exports.genres = genres;
// Annotate the CommonJS export names for ESM import in node:

