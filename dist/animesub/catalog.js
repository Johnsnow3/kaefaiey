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

// providers/animesub/catalog.ts
var catalog_exports = {};
__export(catalog_exports, {
  catalog: () => catalog,
  genres: () => genres
});

var catalog = [
  {
    title: "Top Airing",
    filter: "mal:topanime:airing"
  },
  {
    title: "Current Season",
    filter: "mal:season:current"
  },
  {
    title: "Most Popular",
    filter: "mal:topanime:bypopularity"
  },
  {
    title: "Most Favorited",
    filter: "mal:topanime:favorite"
  }
];
var genres = [
  {
    title: "Action",
    filter: "mal:genre:1:Action"
  },
  {
    title: "Adventure",
    filter: "mal:genre:2:Adventure"
  },
  {
    title: "Comedy",
    filter: "mal:genre:4:Comedy"
  },
  {
    title: "Drama",
    filter: "mal:genre:8:Drama"
  },
  {
    title: "Fantasy",
    filter: "mal:genre:10:Fantasy"
  },
  {
    title: "Horror",
    filter: "mal:genre:14:Horror"
  },
  {
    title: "Mystery",
    filter: "mal:genre:7:Mystery"
  },
  {
    title: "Psychological",
    filter: "mal:genre:40:Psychological"
  },
  {
    title: "Romance",
    filter: "mal:genre:22:Romance"
  },
  {
    title: "Sci-Fi",
    filter: "mal:genre:24:Sci-Fi"
  },
  {
    title: "Slice of Life",
    filter: "mal:genre:36:Slice_of_Life"
  },
  {
    title: "Supernatural",
    filter: "mal:genre:37:Supernatural"
  },
  {
    title: "Sports",
    filter: "mal:genre:30:Sports"
  },
  {
    title: "Suspense",
    filter: "mal:genre:41:Suspense"
  }
];
exports.catalog = catalog;
exports.genres = genres;
// Annotate the CommonJS export names for ESM import in node:

