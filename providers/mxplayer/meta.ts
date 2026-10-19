import { Info, ProviderContext } from "../types";

const API_URL = "https://api.mxplayer.in/v1/web";
const IMAGE_URL = "https://qqcdnpictest.mxplay.com/";
const desktopParams =
  "device-density=2&platform=com.mxplay.desktop&content-languages=hi,en,te,ta,kn,ml,mr,bn,gu,pa&kids-mode-enabled=false";

const defaultHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://www.mxplayer.in/",
  Origin: "https://www.mxplayer.in",
  Accept: "application/json, text/plain, */*",
};

function formatImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${IMAGE_URL}${url.replace(/^\/+/, "")}`;
}

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

export const getMeta = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  const { axios } = providerContext;

  const hexMatch = link.match(/([a-f0-9]{32})/i);
  const id = hexMatch ? hexMatch[1] : null;
  const isShow = link.includes("/tvshow/") || link.includes("/show/");

  // ==========================================
  // STRATEGY 1: PURE API QUERY WITH DESKTOP PARAMS
  // ==========================================
  if (id) {
    if (isShow) {
      // ── TV SHOW VIA REST API ──
      try {
        const seasonsUrl = `${API_URL}/detail/tab/tvshowseasons?type=tvshow&id=${id}&${desktopParams}`;
        const res = await axios.get(seasonsUrl, { headers: defaultHeaders, timeout: 6000 });
        const data = res.data;
        const items = data.items || [];
        const container = items[0]?.container;

        const title = container?.title || items[0]?.title || "TV Show";
        const synopsis = items[0]?.description || "";

        let image = "";
        const bannerImg =
          container?.imageInfo?.find((i: any) => i.type === "bigpic" || i.type === "landscape") ||
          items[0]?.imageInfo?.find((i: any) => i.type === "bigpic" || i.type === "landscape");
        if (bannerImg?.url) image = formatImageUrl(bannerImg.url);

        let poster = "";
        const portraitImg =
          container?.imageInfo?.find((i: any) => i.type === "portrait_large" || i.type === "portrait") ||
          items[0]?.imageInfo?.find((i: any) => i.type === "portrait_large" || i.type === "portrait");
        if (portraitImg?.url) poster = formatImageUrl(portraitImg.url);

        const tags = items[0]?.genres || [];
        const sorted = [...items].sort(
          (a: any, b: any) => (a.sequence || 0) - (b.sequence || 0)
        );

        const linkList = sorted.map((s: any) => ({
          title: s.title || `Season ${s.sequence || 1}`,
          quality: "Standard",
          episodesLink: s.id,
          directLinks: [],
        }));

        if (title && title.toLowerCase() !== "oops!" && title.toLowerCase() !== "oops!!!") {
          return {
            title,
            synopsis,
            image: image || poster,
            poster: poster || image || undefined,
            type: "series",
            tags,
            linkList,
            webUrl: link,
          };
        }
      } catch (err) {
        console.warn("MX TVShow API meta failed, trying fallback:", err);
      }
    } else {
      // ── MOVIE VIA REST API ──
      try {
        const videoUrl = `${API_URL}/detail/video?id=${id}&type=movie&${desktopParams}`;
        const res = await axios.get(videoUrl, { headers: defaultHeaders, timeout: 6000 });
        const d = res.data;

        if (d && d.title && d.title.toLowerCase() !== "oops!" && d.title.toLowerCase() !== "oops!!!") {
          let image = "";
          const bannerImg =
            d.titleContentImageInfo?.find((i: any) => i.type === "banner_and_static_bg_desktop" || i.width >= 1280) ||
            d.imageInfo?.find((i: any) => i.type === "bigpic" || i.type === "landscape");
          if (bannerImg?.url) image = formatImageUrl(bannerImg.url);

          let poster = "";
          const portraitImg = d.imageInfo?.find((i: any) => i.type === "portrait_large" || i.type === "portrait");
          if (portraitImg?.url) poster = formatImageUrl(portraitImg.url);

          const cast = d.contributors?.map((c: any) => c.name).filter(Boolean);

          return {
            title: d.title,
            synopsis: d.description || "",
            image: image || poster,
            poster: poster || image || undefined,
            rating: d.rating ? String(d.rating) : undefined,
            tags: d.genres || [],
            cast,
            type: "movie",
            linkList: [
              {
                title: "Movie",
                quality: "Default",
                episodesLink: link,
                directLinks: [],
              },
            ],
            webUrl: link,
          };
        }
      } catch (err) {
        console.warn("MX Movie video API meta failed, trying fallback:", err);
      }
    }
  }

  // ==========================================
  // STRATEGY 2: HTML STATE SCRAPING (FALLBACK)
  // ==========================================
  try {
    const pageUrl = link.startsWith("http") ? link : `https://www.mxplayer.in/detail/movie/${id}`;
    const res = await axios.get(pageUrl, { headers: defaultHeaders, timeout: 6000 });
    const rawHtml = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    const parsedState = extractJson(rawHtml, "window.__mxs__");

    if (parsedState?.entities) {
      const entity = (id && parsedState.entities[id]) || (Object.values(parsedState.entities)[0] as any);
      if (entity && entity.title && entity.title.toLowerCase() !== "oops!" && entity.title.toLowerCase() !== "oops!!!") {
        let image = "";
        const bannerImg =
          entity.titleContentImageInfo?.find((i: any) => i.type === "banner_and_static_bg_desktop" || i.width >= 1280) ||
          entity.imageInfo?.find((i: any) => i.type === "bigpic" || i.type === "landscape");
        if (bannerImg?.url) image = formatImageUrl(bannerImg.url);

        let poster = "";
        const portraitImg = entity.imageInfo?.find((i: any) => i.type === "portrait_large" || i.type === "portrait");
        if (portraitImg?.url) poster = formatImageUrl(portraitImg.url);

        const type = entity.type === "tvshow" || entity.type === "show" ? "series" : "movie";
        const linkList: any[] = [];

        if (type === "series" && entity.tabs) {
          const epTab = entity.tabs.find((t: any) => t.type === "tvshowepisodes" || t.title === "EPISODES");
          if (epTab?.containers?.length) {
            const sorted = [...epTab.containers].sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));
            sorted.forEach((season: any) => {
              linkList.push({
                title: season.title || `Season ${season.sequence || 1}`,
                quality: "Standard",
                episodesLink: season.id,
                directLinks: [],
              });
            });
          }
        }

        if (linkList.length === 0) {
          linkList.push({
            title: "Movie",
            quality: "Default",
            episodesLink: link,
            directLinks: [],
          });
        }

        return {
          title: entity.title,
          synopsis: entity.description || "",
          image: image || poster,
          poster: poster || image || undefined,
          type,
          tags: entity.genres || [],
          rating: entity.rating ? String(entity.rating) : undefined,
          linkList,
          webUrl: link,
        };
      }
    }
  } catch (err) {
    console.error("MXPlayer HTML scraping failed:", err);
  }

  // Final fallback
  return {
    title: "",
    synopsis: "",
    image: "",
    type: isShow ? "series" : "movie",
    linkList: [
      {
        title: isShow ? "Episodes" : "Movie",
        quality: "Default",
        episodesLink: link,
        directLinks: [],
      },
    ],
    webUrl: link,
  };
};
