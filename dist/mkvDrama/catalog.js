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

// providers/mkvDrama/catalog.ts
var catalog_exports = {};
__export(catalog_exports, {
  catalog: () => catalog,
  genres: () => genres
});

var catalog = [
  { title: "Latest", filter: "titles?status=&type=&order=latest" },
  { title: "Drama", filter: "titles?type=drama&order=latest" },
  { title: "Movies", filter: "titles?type=movie&order=latest" },
  { title: "Mini Drama", filter: "titles?type=mini_drama&order=latest" },
  { title: "Ongoing", filter: "titles?status=ongoing&order=latest" },
  { title: "Completed", filter: "titles?status=completed&order=latest" }
];
var genres = [
  { title: "Korean", filter: "titles?country[]=south-korea&order=latest" },
  { title: "Chinese", filter: "titles?country[]=china&order=latest" },
  { title: "Japanese", filter: "titles?country[]=japan&order=latest" },
  { title: "Thai", filter: "titles?country[]=thailand&order=latest" },
  { title: "Action", filter: "titles?genre[]=action&order=latest" },
  { title: "Romance", filter: "titles?genre[]=romance&order=latest" },
  { title: "Thriller", filter: "titles?genre[]=thriller&order=latest" }
];
exports.catalog = catalog;
exports.genres = genres;
// Annotate the CommonJS export names for ESM import in node:

