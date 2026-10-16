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

// providers/mkvDrama/settings.ts
var settings_exports = {};
__export(settings_exports, {
  getSettingsSchema: () => getSettingsSchema
});

var getSettingsSchema = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    providerContext
  }) {
    return [
      {
        key: "mkvDrama_quickDownload",
        type: "toggle",
        label: "Quick Download",
        description: "Automatically download the preferred server in 1-click without showing server selection",
        defaultValue: true
      },
      {
        key: "mkvDrama_preferredDownloadServer",
        type: "select",
        label: "Preferred Download Server",
        description: "Server to prioritize for 1-click quick download",
        options: [
          { label: "Auto (Best Available)", value: "auto" },
          { label: "CF Worker (Fastest)", value: "cf worker" },
          { label: "CF Storage (R2 Direct)", value: "cf storage" },
          { label: "GDrive (Google Direct)", value: "gdrive" },
          { label: "Pixeldrain", value: "pixeldrain" },
          { label: "FastDl", value: "fastdl" },
          { label: "HubCdn", value: "hubcdn" }
        ],
        defaultValue: "auto"
      }
    ];
  });
}, "getSettingsSchema");
exports.getSettingsSchema = getSettingsSchema;
// Annotate the CommonJS export names for ESM import in node:

