import { EpisodeLink, ProviderContext } from "../types";

const API_URL = "https://api.mxplayer.in/v1/web";
const IMAGE_URL = "https://qqcdnpictest.mxplay.com/";

const defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Referer: "https://www.mxplayer.in/",
};

function extractJson(text: string, startKey: string): any {
  if (!text || typeof text !== "string") return null;
  const kIdx = text.indexOf(startKey);
  if (kIdx === -1) return null;
  const start = text.indexOf("{", kIdx);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === "\"" && !escape) {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(text.substring(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

async function fetchSeasonEpisodes(seasonId: string, axios: any): Promise<EpisodeLink[]> {
  const episodes: EpisodeLink[] = [];
  let nextQuery: string | null = null;
  const endParam = `&device-density=2&userid=&platform=com.mxplay.desktop&content-languages=hi,en&kids-mode-enabled=false`;

  do {
    let apiUrl = `${API_URL}/detail/tab/tvshowepisodes?type=season&id=${seasonId}&sortOrder=0${endParam}`;
    if (nextQuery) {
      apiUrl = `${API_URL}/detail/tab/tvshowepisodes?type=season&${nextQuery}&id=${seasonId}&sortOrder=0${endParam}`;
    }

    try {
      const res = await axios.get(apiUrl, { headers: defaultHeaders });
      const data = res.data;
      const items = data.items || [];

      for (const item of items) {
        const title = item.title || `Episode ${item.sequence}`;
        const imgPath = item.imageInfo?.[0]?.url;
        const image = imgPath ? IMAGE_URL + imgPath : "";

        const streamData = JSON.stringify({
          stream: item.stream,
          videoHash: item.videoHash,
        });

        episodes.push({
          title,
          link: streamData,
          image,
        });
      }

      nextQuery = data.next;
    } catch (e) {
      console.error("Error fetching episodes for season", seasonId, e);
      break;
    }
  } while (nextQuery);

  return episodes;
}

export const getEpisodes = async function ({
  url, // Season ID (from meta) or a Web URL
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  const { axios } = providerContext;

  const isWebUrl = url.startsWith("http");

  if (isWebUrl) {
    if (url.includes("/tvshow/") || url.includes("/show/")) {
      try {
        const pageRes = await axios.get(url, { headers: defaultHeaders });
        const rawHtml =
          typeof pageRes.data === "string"
            ? pageRes.data
            : JSON.stringify(pageRes.data);
        const parsed = extractJson(rawHtml, "window.__mxs__");
        const entity = Object.values(parsed?.entities || {})[0] as any;
        const epTab = entity?.tabs?.find(
          (t: any) =>
            t.type === "tvshowepisodes" ||
            t.title === "EPISODES" ||
            (t.containers && t.containers.length > 0)
        );
        const season =
          epTab?.containers?.find((c: any) => c.sequence === 1) ||
          epTab?.containers?.[0];
        if (season?.id) {
          return await fetchSeasonEpisodes(season.id, axios);
        }
      } catch (err) {
        console.error("Failed to parse TV show URL for episodes:", err);
      }
    }

    // Default movie single episode
    return [
      {
        title: "Full Movie",
        link: url,
        image: "",
      },
    ];
  }

  // Season ID passed
  return await fetchSeasonEpisodes(url, axios);
};