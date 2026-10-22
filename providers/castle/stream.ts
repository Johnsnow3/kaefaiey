import { ProviderContext, Stream, TextTracks } from "../types";
import {
  apiMovieDetails,
  apiVideoUrl,
  parsePlayLink,
  pickDetails,
  RESOLUTIONS,
  QUALITY_NAME,
  QUALITY_NUM,
} from "./castleCore";

export function extractSubtitles(...sources: any[]): TextTracks {
  const tracks: TextTracks = [];
  const seenLangs = new Set<string>();

  for (const src of sources) {
    if (!src) continue;
    const list = Array.isArray(src) ? src : [src];
    for (const item of list) {
      if (!item) continue;
      const uri = String(item.url || item.uri || "").trim();
      if (!uri) continue;

      const title = String(item.title || item.languageName || item.abbreviate || "English").trim();
      const language = String(item.abbreviate || item.language || "en").toLowerCase().trim();
      const key = `${title.toLowerCase()}_${language}`;
      if (seenLangs.has(key)) continue;
      seenLangs.add(key);

      const isVtt = uri.includes(".vtt");
      const isSrt = uri.includes(".srt");

      tracks.push({
        title,
        language,
        type: isVtt ? "text/vtt" : isSrt ? "application/x-subrip" : "text/vtt",
        uri,
      });
    }
  }
  return tracks;
}

export async function getStream({
  link,
  type,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  try {
    const { movieId, episodeId } = parsePlayLink(link);
    if (!movieId) return [];

    const env = await apiMovieDetails(movieId, providerContext, signal);
    const details = pickDetails(env);
    const episodes: any[] = Array.isArray(details.episodes) ? details.episodes : [];
    if (!episodes.length) return [];

    const episode =
      (episodeId && episodes.find((e) => String(e.id) === String(episodeId))) ||
      episodes[0];
    if (!episode?.id) return [];

    const epId = String(episode.id);
    const title = details.title || "Castle TV";
    const tracks: any[] = Array.isArray(episode.tracks) ? episode.tracks : [];

    // Extract all subtitles across episode, details, and individual audio/language tracks
    const trackSubs = tracks.flatMap((t) => [t?.subtitles, t?.subtitleList]);
    const baseSubs: TextTracks = extractSubtitles(
      episode.subtitles,
      episode.subtitleList,
      details.subtitles,
      details.subtitleList,
      ...trackSubs
    );

    const streams: Stream[] = [];
    const seen = new Set<string>();

    async function tryOne(
      langId: string | null,
      langName: string,
      res: string
    ) {
      try {
        const envV = await apiVideoUrl(movieId, epId, res, langId, providerContext, signal);
        const v = envV?.data?.data ?? envV?.data ?? {};
        const url = v.videoUrl;
        if (!url || v.permissionDenied === true) return;

        const cleanBase = url.split("?")[0];
        const streamKey = `${langName}_${res}_${cleanBase}`;
        if (seen.has(streamKey)) return;
        seen.add(streamKey);

        const parts = [title];
        if (langName) parts.push(langName);
        if (QUALITY_NAME[res]) parts.push(QUALITY_NAME[res]);
        if (/preview/i.test(url)) parts.push("preview");

        // Merge any additional subtitles returned by the video endpoint
        const vSubs = extractSubtitles(v.subtitles, v.subtitleList);
        const allSubs = extractSubtitles(baseSubs, vSubs);

        streams.push({
          server: parts.join(" - "),
          link: url,
          type: /\.m3u8(\?|#|$)/i.test(url) ? "m3u8" : "mp4",
          quality: String(QUALITY_NUM[res] || res || "720"),
          tag: langName,
          subtitles: allSubs.length ? allSubs : undefined,
          headers: {
            Referer: "https://api.hlowb.com/",
            "User-Agent": "okhttp/4.9.0",
          },
        });
      } catch {
        /* try next */
      }
    }

    const tasks: Array<() => Promise<void>> = [];

    if (tracks.length > 0) {
      // Prioritize default language first if specified
      const sortedTracks = [...tracks].sort((a, b) => {
        if (a?.isDefault && !b?.isDefault) return -1;
        if (!a?.isDefault && b?.isDefault) return 1;
        return 0;
      });

      for (const t of sortedTracks) {
        if (!t || t.languageId == null) continue;
        const lname = t.languageName || t.abbreviate || "Unknown";
        for (const res of RESOLUTIONS) {
          tasks.push(() => tryOne(String(t.languageId), lname, res));
        }
      }
    } else {
      for (const res of RESOLUTIONS) {
        tasks.push(() => tryOne(null, "Default", res));
      }
    }

    // Execute requests in parallel chunks for high speed
    const CHUNK_SIZE = 5;
    for (let i = 0; i < tasks.length; i += CHUNK_SIZE) {
      await Promise.all(tasks.slice(i, i + CHUNK_SIZE).map((fn) => fn()));
    }

    // Sort streams: 1080p > 720p > 480p
    streams.sort((a, b) => {
      const qA = parseInt(a.quality || "0", 10);
      const qB = parseInt(b.quality || "0", 10);
      return qB - qA;
    });

    return streams;
  } catch (err) {
    console.error("CastleTV getStream error:", err);
    return [];
  }
}
