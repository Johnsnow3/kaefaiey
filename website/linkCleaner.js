/**
 * Link Sanitization & Cleaning Utilities for Vega Providers.
 * Ensures all output links across all 60+ providers are clean, absolute,
 * decoded, and free of tracking tags or broken protocol formatting.
 */

function decodeHtmlEntities(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#038;/g, "&");
}

function isJsonString(str) {
  if (typeof str !== "string") return false;
  const trimmed = str.trim();
  return (trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"));
}

function cleanEpisodeLink(rawLink, provider = "") {
  if (!rawLink || typeof rawLink !== "string") return "";

  const trimmed = rawLink.trim();

  // If this is a JSON-encoded payload, parse and convert to a clean URL / clean identifier
  if (isJsonString(trimmed)) {
    try {
      const parsed = JSON.parse(trimmed);

      // 1. Ringz / Direct URL payload: { url: "https://...", server: "..." }
      if (parsed.url && typeof parsed.url === "string" && parsed.url.startsWith("http")) {
        return cleanUrl(parsed.url);
      }

      // 2. Anikoto payload: { slug, epNum, dataIds, ... }
      if (parsed.slug && (parsed.epNum !== undefined || parsed.dataIds !== undefined)) {
        const ep = parsed.epNum || "1";
        const query = parsed.dataIds ? `?dataIds=${encodeURIComponent(parsed.dataIds)}` : "";
        return `https://anikototv.to/watch/${parsed.slug}/ep-${ep}${query}`;
      }

      // 3. Torrentio / Cinemeta / Everything payload: { imdbId, season, episode, type, ... }
      if (parsed.imdbId && String(parsed.imdbId).startsWith("tt")) {
        const isSeries = parsed.type === "series" || Boolean(parsed.season || parsed.episode);
        if (isSeries && (parsed.season || parsed.episode)) {
          return `${parsed.imdbId}:${parsed.season || 1}:${parsed.episode || 1}`;
        }
        return parsed.imdbId;
      }

      // 4. AutoEmbed / Cinemeta with TMDB ID or IMDb
      if (parsed.tmdbId || parsed.id) {
        const idVal = parsed.imdbId || parsed.tmdbId || parsed.id;
        const isSeries = parsed.type === "series" || Boolean(parsed.season || parsed.episode);
        if (isSeries && (parsed.season || parsed.episode)) {
          return `${idVal}:${parsed.season || 1}:${parsed.episode || 1}`;
        }
        return String(idVal);
      }

      // 5. AnimeSub / Kitsu / MAL payload: { malId, kitsuId, season, episode, ... }
      if (parsed.malId || parsed.kitsuId) {
        const idVal = parsed.malId ? `mal:${parsed.malId}` : `kitsu:${parsed.kitsuId}`;
        if (parsed.season || parsed.episode) {
          return `${idVal}:${parsed.season || 1}:${parsed.episode || 1}`;
        }
        return idVal;
      }
    } catch {
      // If parsing fails, fall through to return normalized string without URL corruption
      return trimmed;
    }
  }

  return cleanUrl(rawLink);
}

function cleanUrl(rawUrl, baseUrl = "") {
  if (!rawUrl || typeof rawUrl !== "string") return "";

  let cleaned = decodeHtmlEntities(rawUrl.trim());

  // Do not perform URL slash compression on JSON payloads
  if (isJsonString(cleaned)) {
    return cleaned;
  }

  // Handle protocol-relative URLs
  if (cleaned.startsWith("//")) {
    cleaned = "https:" + cleaned;
  }

  // Handle double slashes in paths (but preserve protocol https://)
  cleaned = cleaned.replace(/([^:])\/{2,}/g, "$1/");

  // Remove common tracking query parameters
  try {
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      const parsed = new URL(cleaned);
      const trackingParams = [
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "fbclid", "gclid", "_ga", "ref", "ref_src"
      ];
      let changed = false;
      for (const param of trackingParams) {
        if (parsed.searchParams.has(param)) {
          parsed.searchParams.delete(param);
          changed = true;
        }
      }
      if (changed) {
        cleaned = parsed.toString();
      }
    } else if (baseUrl && (baseUrl.startsWith("http://") || baseUrl.startsWith("https://"))) {
      try {
        const full = new URL(cleaned, baseUrl).toString();
      } catch (e) {}
    }
  } catch (err) {
    // If invalid URL, return normalized string
  }

  return cleaned;
}

function cleanPost(post) {
  if (!post || typeof post !== "object") return post;
  return {
    ...post,
    title: decodeHtmlEntities(post.title || "").trim(),
    link: cleanUrl(post.link),
    image: cleanUrl(post.image),
    tag: post.tag ? decodeHtmlEntities(post.tag).trim() : undefined,
    cornerTag: post.cornerTag ? decodeHtmlEntities(post.cornerTag).trim() : undefined,
  };
}

function cleanStream(stream) {
  if (!stream || typeof stream !== "object") return stream;
  const cleaned = {
    ...stream,
    server: decodeHtmlEntities(stream.server || "").trim(),
    link: cleanUrl(stream.link),
    type: stream.type ? stream.type.trim() : "mkv",
  };

  if (Array.isArray(stream.subtitles)) {
    cleaned.subtitles = stream.subtitles.map((sub) => ({
      ...sub,
      title: decodeHtmlEntities(sub.title || "").trim(),
      language: (sub.language || "").trim(),
      uri: cleanUrl(sub.uri),
    }));
  }

  return cleaned;
}

function cleanMeta(meta) {
  if (!meta || typeof meta !== "object") return meta;
  const cleaned = {
    ...meta,
    title: decodeHtmlEntities(meta.title || "").trim(),
    image: cleanUrl(meta.image),
    poster: meta.poster ? cleanUrl(meta.poster) : undefined,
    synopsis: decodeHtmlEntities(meta.synopsis || "").trim(),
  };

  if (Array.isArray(meta.linkList)) {
    cleaned.linkList = meta.linkList.map((linkItem) => {
      const cleanedItem = {
        ...linkItem,
        title: decodeHtmlEntities(linkItem.title || "").trim(),
        episodesLink: linkItem.episodesLink ? cleanEpisodeLink(linkItem.episodesLink) : undefined,
      };
      if (Array.isArray(linkItem.directLinks)) {
        cleanedItem.directLinks = linkItem.directLinks.map((dl) => ({
          ...dl,
          title: decodeHtmlEntities(dl.title || "").trim(),
          link: cleanEpisodeLink(dl.link),
          image: dl.image ? cleanUrl(dl.image) : undefined,
        }));
      }
      return cleanedItem;
    });
  }

  return cleaned;
}

function cleanEpisode(episode) {
  if (!episode || typeof episode !== "object") return episode;
  return {
    ...episode,
    title: decodeHtmlEntities(episode.title || "").trim(),
    link: cleanEpisodeLink(episode.link),
    image: episode.image ? cleanUrl(episode.image) : undefined,
    description: episode.description ? decodeHtmlEntities(episode.description).trim() : undefined,
  };
}

module.exports = {
  cleanUrl,
  cleanEpisodeLink,
  cleanPost,
  cleanStream,
  cleanMeta,
  cleanEpisode,
  decodeHtmlEntities,
};
