"use strict";

// ============ Helper Utilities ============

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;

var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value })
    : (obj[key] = value);

var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b))
      __propIsEnum.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  return a;
};

var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

var __name = (target, value) =>
  __defProp(target, "name", { value: value, configurable: true });

var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

var __copyProps = (to, from, except, desc) => {
  if ((from && "object" == typeof from) || "function" == typeof from)
    for (let key of __getOwnPropNames(from))
      __hasOwnProp.call(to, key) ||
        key === except ||
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  return to;
};

var __toCommonJS = (mod) =>
  __copyProps(__defProp({}, "__esModule", { value: true }), mod);

var __async = (__this, __arguments, generator) =>
  new Promise((resolve, reject) => {
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
    var step = (x) =>
      x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });

var episodes_exports = {};

// ============ Error Helpers ============

function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  if ("string" == typeof error) return error;
  try {
    return JSON.stringify(error);
  } catch (e) {
    return String(error);
  }
}

function throwProviderError(provider, operation, error) {
  const response = error?.response;
  const status = response?.status;
  const statusText = response?.statusText;
  const url = response?.config?.url || error?.config?.url;
  const details = [
    status ? `HTTP ${status}${statusText ? ` ${statusText}` : ""}` : "",
    url ? `URL ${url}` : "",
    getErrorMessage(error),
  ].filter(Boolean);
  throw new Error(`${provider} ${operation} failed: ${details.join(" | ")}`);
}

__export(episodes_exports, { getEpisodes: () => getEpisodes });
__name(getErrorMessage, "getErrorMessage");
__name(throwProviderError, "throwProviderError");

// ============ Cinemeta Integration ============

var CINEMETA_BASE_URL = "https://v3-cinemeta.strem.io/meta";
var CONTEXT_KEY = "cinemetaMeta";

function isCinemetaPromise(value) {
  return "function" == typeof value.then;
}

/**
 * Gets the global cache object for Cinemeta metadata.
 */
function getCache() {
  const state =
    "undefined" != typeof providerGlobal && providerGlobal ? providerGlobal : globalThis;
  if (
    !state.__vegaCinemetaCache__ ||
    "object" != typeof state.__vegaCinemetaCache__
  ) {
    state.__vegaCinemetaCache__ = Object.create(null);
  }
  return state.__vegaCinemetaCache__;
}

/**
 * Resolves a TMDB ID to an IMDB ID via the TMDB API.
 */
function resolveTmdbToImdb(tmdbId, type, providerContext) {
  return __async(this, null, function* () {
    try {
      const tmdbType = "series" === type ? "tv" : "movie";
      const imdb = (
        yield providerContext.axios.get(
          `https://api.themoviedb.org/3/${tmdbType}/${tmdbId}/external_ids?api_key=cfe422613b250f702980a3bbf9e90716`,
          { timeout: 5000 }
        )
      ).data?.imdb_id;

      if ("string" == typeof imdb && /^tt\d+$/.test(imdb)) return imdb;
    } catch (e) {}
    return null;
  });
}

/**
 * Fetches Cinemeta metadata (with caching) for an IMDB ID.
 * Supports TMDB IDs and URLs as well.
 */
function getCinemetaMeta(id, type, providerContext) {
  return __async(this, null, function* () {
    if (!id || "string" != typeof id) return null;

    // Extract IMDB ID directly if present
    let cleanImdbId = id.match(/tt\d+/)?.[0];

    // Try to resolve a TMDB ID if no IMDB ID found
    if (!cleanImdbId) {
      const tmdbMatch =
        id.match(/(?:themoviedb\.org\/(?:movie|tv)\/|tmdb:?)(\d+)/i) ||
        id.match(/^(\d+)$/);
      if (tmdbMatch) {
        cleanImdbId =
          (yield resolveTmdbToImdb(tmdbMatch[1], type, providerContext)) || void 0;
      }
    }

    if (!cleanImdbId) return null;

    const cache = getCache();
    const cached = cache[cleanImdbId];

    // Return cached entry (either a promise or a valid meta object)
    if (cached) {
      if (isCinemetaPromise(cached)) return cached;
      if (cached.name && cached.imdb_id === cleanImdbId) return cached;
      delete cache[cleanImdbId];
    }

    const url = `${CINEMETA_BASE_URL}/${"series" === type ? "series" : "movie"}/${cleanImdbId}.json`;

    const request = providerContext.axios
      .get(url, { timeout: 8000 })
      .then((response) => {
        const meta = response.data?.meta;
        if (meta?.name && meta.imdb_id === cleanImdbId) {
          cache[cleanImdbId] = meta;
          return meta;
        }
        delete cache[cleanImdbId];
        return null;
      })
      .catch(() => {
        delete cache[cleanImdbId];
        return null;
      });

    cache[cleanImdbId] = request;
    return request;
  });
}

/**
 * Parses the URL hash for an embedded cinemeta context object.
 * Returns the cleaned request URL plus optional imdbId/season info.
 */
function readCinemetaContext(url) {
  const parsedUrl = new URL(url);
  const encoded = new URLSearchParams(parsedUrl.hash.slice(1)).get(CONTEXT_KEY);
  parsedUrl.hash = "";

  if (!encoded) return { requestUrl: parsedUrl.href };

  try {
    const context = JSON.parse(decodeURIComponent(encoded));
    if (/^tt\d+$/.test(context.imdbId) && Number.isInteger(context.season)) {
      return {
        requestUrl: parsedUrl.href,
        imdbId: context.imdbId,
        season: context.season,
      };
    }
  } catch (e) {
    return { requestUrl: parsedUrl.href };
  }
  return { requestUrl: parsedUrl.href };
}

// ============ Episode Number Parsing ============

/**
 * Extracts a single episode number from a title string.
 * Returns undefined if multiple episodes are mentioned or none found.
 */
function getEpisodeNumber(title, season) {
  // Skip multi-episode ranges (e.g. "E1-E2", "Episodes 1, 2 and 3")
  if (
    /\b(?:e\d+|episodes?\s*:?\s*\d+)\s*(?:[-–,&/]|\band\b)\s*(?:e|episodes?\s*:?\s*)?\d+/i.test(
      title
    )
  )
    return;

  // Skip titles referencing a different season
  if (
    [
      ...title.matchAll(/\bseason\s*:?\s*(\d{1,2})\b/gi),
      ...title.matchAll(/\bs(\d{1,2})\s*e\d{1,3}\b/gi),
    ]
      .map((match) => Number(match[1]))
      .some((value) => value !== season)
  )
    return;

  const matches = [
    ...title.matchAll(/\bs\d{1,2}\s*e(\d{1,3})\b/gi),
    ...title.matchAll(/\bepisodes?\s*:?\s*(\d{1,3})\b/gi),
    ...title.matchAll(/\bep\s*\.?:?\s*(\d{1,3})\b/gi),
    ...title.matchAll(/\be(\d{1,3})\b/gi),
    ...title.matchAll(/^\s*(\d{1,3})\s*[.:-]\s*/gi),
  ].map((match) => Number(match[1]));

  const episodes = [...new Set(matches.filter((episode) => episode > 0))];
  return 1 === episodes.length ? episodes[0] : void 0;
}

// ============ Cinemeta Episode Enrichment ============

/**
 * Enriches episode list with Cinemeta video data (description, thumbnail).
 * Only applies if every episode can be matched to a unique video.
 */
function enrichCinemetaEpisodes(episodes, videos, season) {
  if (!videos || !Array.isArray(videos) || 0 === videos.length || !season)
    return episodes;

  const videosByEpisode = new Map();
  let hasDuplicateVideo = false;

  for (const video of videos) {
    const episode = video.episode ?? video.number;
    if (video.season === season && episode) {
      if (videosByEpisode.has(episode)) {
        hasDuplicateVideo = true;
      } else {
        videosByEpisode.set(episode, video);
      }
    }
  }

  const matched = episodes.map((episode) => {
    const episodeNumber = getEpisodeNumber(episode.title, season);
    const video = episodeNumber ? videosByEpisode.get(episodeNumber) : void 0;
    return {
      episode: episode,
      episodeNumber: episodeNumber,
      video: video,
      description: video?.description || video?.overview,
    };
  });

  const numbers = matched.map(({ episodeNumber }) => episodeNumber);

  // Only apply if all episodes matched uniquely
  return episodes.length > 0 &&
    !hasDuplicateVideo &&
    matched.every(({ video }) => Boolean(video)) &&
    new Set(numbers).size === numbers.length
    ? matched.map(({ episode, video, description }) =>
        __spreadProps(__spreadValues({}, episode), {
          description: description || episode.description,
          image: video?.thumbnail || episode.image,
        })
      )
    : episodes;
}

// ============ TheIntroDb Skip Timings ============

/**
 * Gets the global cache object for TheIntroDb timings.
 */
function getIntroDbCache() {
  const state =
    "undefined" != typeof providerGlobal && providerGlobal ? providerGlobal : globalThis;
  if (
    !state.__vegaTheIntroDbCache__ ||
    "object" != typeof state.__vegaTheIntroDbCache__
  ) {
    state.__vegaTheIntroDbCache__ = Object.create(null);
  }
  return state.__vegaTheIntroDbCache__;
}

/**
 * Fetches intro/recap/credits/preview skip intervals from TheIntroDb API.
 */
function fetchTheIntroDbSkipTimings(_0) {
  return __async(this, arguments, function* ({
    imdbId: imdbId,
    tmdbId: tmdbId,
    season: season,
    episode: episode,
    providerContext: providerContext,
    signal: signal,
    timeout: timeout = 4000,
  }) {
    if (!imdbId && !tmdbId) return [];
    if (!season || !episode || season < 1 || episode < 1) return [];

    const cache = getIntroDbCache();
    const cacheKey = `${imdbId || tmdbId}:${season}:${episode}`;
    const cached = cache[cacheKey];
    if (cached) {
      // Return promise (cache is in-flight) or resolved value
      cached.then;
      return cached;
    }

    const params = new URLSearchParams();
    if (imdbId) params.set("imdb_id", imdbId);
    if (tmdbId) params.set("tmdb_id", tmdbId.toString());
    params.set("season", season.toString());
    params.set("episode", episode.toString());

    const fetchPromise = __async(null, null, function* () {
      try {
        const url = `https://api.theintrodb.org/v2/media?${params.toString()}`;
        const data = (
          yield providerContext.axios.get(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
              Accept: "application/json",
            },
            timeout: timeout,
            signal: signal,
          })
        ).data;

        if (!data || "object" != typeof data) {
          cache[cacheKey] = [];
          return [];
        }

        const skipIntervals = [];

        if (Array.isArray(data.intro)) {
          for (const item of data.intro) {
            const startMs = item?.start_ms ?? 0;
            const endMs = item?.end_ms;
            if ("number" == typeof endMs && endMs > startMs) {
              skipIntervals.push({
                title: "Intro",
                from: Number((startMs / 1000).toFixed(2)),
                to: Number((endMs / 1000).toFixed(2)),
              });
            }
          }
        }

        if (Array.isArray(data.recap)) {
          for (const item of data.recap) {
            const startMs = item?.start_ms ?? 0;
            const endMs = item?.end_ms;
            if ("number" == typeof endMs && endMs > startMs) {
              skipIntervals.push({
                title: "Recap",
                from: Number((startMs / 1000).toFixed(2)),
                to: Number((endMs / 1000).toFixed(2)),
              });
            }
          }
        }

        if (Array.isArray(data.credits)) {
          for (const item of data.credits) {
            const startMs = item?.start_ms;
            const endMs = item?.end_ms;
            if (
              "number" == typeof startMs &&
              "number" == typeof endMs &&
              endMs > startMs
            ) {
              skipIntervals.push({
                title: "Credits",
                from: Number((startMs / 1000).toFixed(2)),
                to: Number((endMs / 1000).toFixed(2)),
              });
            }
          }
        }

        if (Array.isArray(data.preview)) {
          for (const item of data.preview) {
            const startMs = item?.start_ms ?? 0;
            const endMs = item?.end_ms;
            if ("number" == typeof endMs && endMs > startMs) {
              skipIntervals.push({
                title: "Preview",
                from: Number((startMs / 1000).toFixed(2)),
                to: Number((endMs / 1000).toFixed(2)),
              });
            }
          }
        }

        cache[cacheKey] = skipIntervals;
        return skipIntervals;
      } catch (e) {
        delete cache[cacheKey];
        return [];
      }
    });

    cache[cacheKey] = fetchPromise;
    return fetchPromise;
  });
}

/**
 * Enriches episodes with skip timings fetched from TheIntroDb.
 */
function enrichEpisodesWithSkipTimings(episodes, imdbId, season, providerContext, signal) {
  return __async(this, null, function* () {
    if (!imdbId || !season || season < 1 || !/^tt\d+$/.test(imdbId)) return episodes;

    const promises = episodes.map((ep) =>
      __async(null, null, function* () {
        const episodeNum = getEpisodeNumber(ep.title, season);
        if (!episodeNum || episodeNum < 1) return ep;

        const skipTimings = yield fetchTheIntroDbSkipTimings({
          imdbId: imdbId,
          season: season,
          episode: episodeNum,
          providerContext: providerContext,
          signal: signal,
        });

        return skipTimings && skipTimings.length > 0
          ? __spreadProps(__spreadValues({}, ep), { skip: skipTimings })
          : ep;
      })
    );

    return Promise.all(promises);
  });
}

__name(isCinemetaPromise, "isCinemetaPromise");
__name(getCache, "getCache");
__name(resolveTmdbToImdb, "resolveTmdbToImdb");
__name(getCinemetaMeta, "getCinemetaMeta");
__name(readCinemetaContext, "readCinemetaContext");
__name(getEpisodeNumber, "getEpisodeNumber");
__name(enrichCinemetaEpisodes, "enrichCinemetaEpisodes");
__name(getIntroDbCache, "getIntroDbCache");
__name(fetchTheIntroDbSkipTimings, "fetchTheIntroDbSkipTimings");
__name(enrichEpisodesWithSkipTimings, "enrichEpisodesWithSkipTimings");

// ============ Main Episode Extractor ============

var getEpisodes = __name(function (_0) {
  return __async(this, arguments, function* ({
    url: url,
    providerContext: providerContext,
  }) {
    const { axios: axios, cheerio: cheerio, commonHeaders: headers } =
      providerContext;

    console.log("getEpisodeLinks", url);

    try {
      // Parse embedded context (imdbId/season) from URL hash
      const context = readCinemetaContext(url);

      const res = yield axios.get(context.requestUrl, {
        headers: __spreadProps(__spreadValues({}, headers), {
          cookie:
            "ext_name=ojplmecpdpgccookcobabopnaifgidhf; cf_clearance=6yZYfXQxBgjaD1eacR5zZCz7njssbxjtSZZCElTOGk0-1764836255-1.2.1.1-bzHvDcDRLp6AAYo7qvGVzJ6Gk6zaqAepuGiGhAWCGYL.ZDpw5yI4TkUIXDgAnEhGCZ9J5X2_OagzgeMHZrd8rzeyAFQXj0dmYMErcfII7_Rhq5kZ4kAtS0tl9PtaNKKd2m4taIufySXCCstl3iNLMODTjbsW_KZi8U8DauOdGSAhBd1DCGxvLlAOM.snfkhb0yQiVJcLW8Bv9IeKQac0ar_TKkV6QexqNZYiyRXnE7E; xla=s4t",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0",
        }),
      });

      const $ = cheerio.load(res.data);
      const container = $(".entry-content,.entry-inner");

      // Remove unwanted blocks before parsing
      $(".unili-content,.code-block-1").remove();

      const episodes = [];

      // Iterate over heading/paragraph elements looking for episode markers
      container.find("h3, h4, h5, p").each((index, element) => {
        const el = $(element);
        const text = el.text().trim();

        if (
          /episodes?\s*[:\d\-]/i.test(text) ||
          /e\d{1,3}\b/i.test(text) ||
          /^episode\s*\d+/i.test(text)
        ) {
          // Normalize title
          const title = text
            .replace(/\s+/g, " ")
            .trim()
            .replace(/^[-:\s]+|[-:\s]+$/g, "")
            .replace(/^episodes?\s*:\s*/i, "Episode ");

          // Find the next paragraph element that contains links
          let nextP = el.next();
          while (
            nextP.length &&
            !nextP.is("p") &&
            !nextP.find("a[href]").length
          ) {
            nextP = nextP.next();
          }

          const vcloudLink = nextP
            .find("a[href*='vcloud'], a[href*='hubcloud']")
            .attr("href");
          const vegadriveLink = nextP.find("a[href*='vegadrive']").attr("href");

          // Build combined link (JSON if both hubcloud and vegadrive exist)
          let link = "";
          if (vcloudLink && vegadriveLink) {
            link = JSON.stringify({ hubcloud: vcloudLink, vegadrive: vegadriveLink });
          } else {
            link =
              vcloudLink ||
              vegadriveLink ||
              nextP.find("a[href*='fastdl']").attr("href") ||
              nextP.find(".btn-outline").parent().attr("href") ||
              nextP.find(".btn-outline").attr("href") ||
              nextP.find("a[href]").first().attr("href") ||
              "";
          }

          if (title && link && !episodes.some((e) => e.title === title)) {
            episodes.push({ title: title, link: link });
          }
        }
      });

      // Read user preferences from kvStore
      const quickDownload = yield providerContext.kvStore?.get("vega_quickDownload");
      const skipTimings = yield providerContext.kvStore?.get("vega_skipTimings");

      // If no imdb context, return episodes with quickDownload flag only
      if (!context.imdbId || !context.season) {
        return episodes.map((e) =>
          __spreadProps(__spreadValues({}, e), {
            quickDownload: quickDownload == null || quickDownload,
          })
        );
      }

      let enriched = episodes;

      // Enrich with Cinemeta metadata (descriptions, thumbnails)
      try {
        const cinemeta = yield getCinemetaMeta(context.imdbId, "series", providerContext);
        if (cinemeta) {
          enriched = enrichCinemetaEpisodes(
            episodes,
            cinemeta.videos || [],
            context.season
          );
        }
      } catch (e) {
        console.warn("Vega: Cinemeta episode lookup failed", e);
      }

      // Enrich with skip timings from TheIntroDb
      if (skipTimings == null || skipTimings) {
        try {
          enriched = yield enrichEpisodesWithSkipTimings(
            enriched,
            context.imdbId,
            context.season,
            providerContext
          );
        } catch (e) {
          console.warn("Vega: Skip timings lookup failed", e);
        }
      }

      return enriched.map((e) =>
        __spreadProps(__spreadValues({}, e), {
          quickDownload: quickDownload == null || quickDownload,
        })
      );
    } catch (err) {
      throwProviderError("Vega", "episodes", err);
    }
  });
}, "getEpisodes");

// ============ Exports ============

exports.getEpisodes = getEpisodes;
