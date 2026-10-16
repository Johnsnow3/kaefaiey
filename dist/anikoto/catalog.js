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

// providers/anikoto/catalog.ts
var catalog_exports = {};
__export(catalog_exports, {
  catalog: () => catalog,
  genres: () => genres
});

var catalog = [
  {
    title: "Popular",
    filter: "/most-viewed"
  },
  {
    title: "Recently Updated",
    filter: "/latest-updated"
  },
  {
    title: "New Releases",
    filter: "/new-release"
  },
  {
    title: "Top Rated",
    filter: "/filter?sort=score"
  },
  {
    title: "Anime Movies",
    filter: "/type/movie"
  },
  {
    title: "Ongoing Anime",
    filter: "/status/currently-airing"
  },
  {
    title: "Completed Anime",
    filter: "/status/finished-airing"
  }
];
var genres = [
  { title: "Action", filter: "/genre/action" },
  { title: "Adventure", filter: "/genre/adventure" },
  { title: "Comedy", filter: "/genre/comedy" },
  { title: "Drama", filter: "/genre/drama" },
  { title: "Ecchi", filter: "/genre/ecchi" },
  { title: "Fantasy", filter: "/genre/fantasy" },
  { title: "Horror", filter: "/genre/horror" },
  { title: "Isekai", filter: "/genre/isekai" },
  { title: "Mecha", filter: "/genre/mecha" },
  { title: "Mystery", filter: "/genre/mystery" },
  { title: "Psychological", filter: "/genre/psychological" },
  { title: "Romance", filter: "/genre/romance" },
  { title: "Sci-Fi", filter: "/genre/sci-fi" },
  { title: "Seinen", filter: "/genre/seinen" },
  { title: "Shoujo", filter: "/genre/shoujo" },
  { title: "Shounen", filter: "/genre/shounen" },
  { title: "Slice of Life", filter: "/genre/slice-of-life" },
  { title: "Sports", filter: "/genre/sports" },
  { title: "Supernatural", filter: "/genre/supernatural" },
  { title: "Thriller", filter: "/genre/thriller" }
];
exports.catalog = catalog;
exports.genres = genres;
// Annotate the CommonJS export names for ESM import in node:

