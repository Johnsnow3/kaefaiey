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

// providers/movielinkdb/catalog.ts
var catalog_exports = {};
__export(catalog_exports, {
  catalog: () => catalog
});

var catalog = [
  { title: "Recently Updated", filter: "" },
  { title: "Movies", filter: "type/movies" },
  { title: "Series", filter: "type/series" },
  { title: "Indonesian", filter: "language/indonesian" },
  { title: "Bangla", filter: "language/bangla" }
];
exports.catalog = catalog;
// Annotate the CommonJS export names for ESM import in node:

