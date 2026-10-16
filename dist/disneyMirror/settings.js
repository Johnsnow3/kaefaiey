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

// providers/disneyMirror/settings.ts
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
        key: "t_hash_t",
        type: "text",
        label: "NetMirror Session Cookie (t_hash_t)",
        description: "Optional: Paste a verified t_hash_t session cookie if you already have one, or leave blank to auto-unlock via sponsor ad verification.",
        placeholder: "e.g. 4d82...::e19a...",
        defaultValue: ""
      },
      {
        key: "baseUrlOverride",
        type: "text",
        label: "Custom Mirror Domain",
        description: "Custom NetMirror mirror domain (default: https://net52.cc)",
        placeholder: "https://net52.cc",
        defaultValue: ""
      }
    ];
  });
}, "getSettingsSchema");
exports.getSettingsSchema = getSettingsSchema;
// Annotate the CommonJS export names for ESM import in node:

