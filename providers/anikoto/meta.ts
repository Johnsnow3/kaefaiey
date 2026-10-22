import { EpisodeLink, Info, Link, ProviderContext } from "../types";
import { throwProviderError } from "../providerErrors";

const BASE_URL = "https://anikototv.to";

function rc4(key: string, input: string): string {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let a = 0;
  for (let n = 0; n < 256; n++) {
    a = (s[n] + a + key.charCodeAt(n % key.length)) % 256;
    const tmp = s[n];
    s[n] = s[a];
    s[a] = tmp;
  }
  let out = "";
  let n2 = 0;
  let a2 = 0;
  for (let r = 0; r < input.length; r++) {
    n2 = (n2 + 1) % 256;
    a2 = (s[n2] + a2) % 256;
    const tmp2 = s[n2];
    s[n2] = s[a2];
    s[a2] = tmp2;
    const k = s[(s[n2] + s[a2]) % 256];
    out += String.fromCharCode(input.charCodeAt(r) ^ k);
  }
  return out;
}

function encodeBase64(str: string): string {
  if (typeof btoa === "function") {
    try {
      return btoa(str);
    } catch {
      // fallback
    }
  }
  if (typeof Buffer !== "undefined") {
    try {
      return Buffer.from(str, "binary").toString("base64");
    } catch {
      // fallback
    }
  }
  return "";
}

function encodeVrf(animeId: string): string {
  const encrypted = rc4("simple-hash", animeId);
  return encodeBase64(encrypted);
}

export const getMeta = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  try {
    const { axios, cheerio } = providerContext;

    let watchUrl = link;
    if (!watchUrl.startsWith("http")) {
      watchUrl = `${BASE_URL}${watchUrl.startsWith("/") ? "" : "/"}${watchUrl}`;
    }
    if (!watchUrl.includes("/ep-")) {
      watchUrl = `${watchUrl.replace(/\/+$/, "")}/ep-1`;
    }

    const slug = watchUrl
      .replace(BASE_URL, "")
      .replace(/^\/watch\//, "")
      .split("/")[0];

    const res = await axios.get(watchUrl, {
      headers: {
        ...providerContext.commonHeaders,
        Referer: `${BASE_URL}/`,
      },
    });

    const $ = cheerio.load(res.data);
    const title =
      $("h1.title").text().trim() ||
      $(".binfo h1").text().trim() ||
      slug;

    const synopsis =
      $("div.synopsis div.content").text().trim() ||
      $("div.synopsis").text().trim() ||
      "";

    const image =
      $("#w-info .poster img, .poster img").first().attr("src") ||
      $("img").first().attr("src") ||
      "";

    const rating =
      $("[itemprop='ratingValue']").first().text().trim() ||
      $(".meta div:contains('MAL'), #w-info div:contains('MAL')")
        .first()
        .text()
        .match(/MAL:\s*(\d+(?:\.\d+)?)/)?.[1] ||
      $(".score .value").text().match(/\d+(?:\.\d+)?/)?.[0] ||
      undefined;

    const tags: string[] = [];
    $("div:contains(Genres) span a, .genre a").each((_, el) => {
      const g = $(el).text().trim();
      if (g && !tags.includes(g)) tags.push(g);
    });

    const typeText = $(".meta div:contains(Type) span, .m-item span")
      .first()
      .text()
      .trim()
      .toLowerCase();
    const type = typeText.includes("movie") ? "movie" : "series";

    const animeId = $("#watch-page, #watch-main, .watch-wrap, [data-id]")
      .first()
      .attr("data-id");

    const linkList: Link[] = [];

    if (animeId) {
      const vrf = encodeURIComponent(encodeVrf(animeId));
      const epAjaxUrl = `${BASE_URL}/ajax/episode/list/${animeId}?vrf=${vrf}&style=default`;

      const epRes = await axios.get(epAjaxUrl, {
        headers: {
          ...providerContext.commonHeaders,
          "X-Requested-With": "XMLHttpRequest",
          Referer: watchUrl,
        },
      });

      if (epRes.data && epRes.data.status === 200 && epRes.data.result) {
        const $ep = cheerio.load(epRes.data.result);
        const rangeUlList = $ep("ul.ep-range, ul[data-range]");

        const mapEpisode = (el: any): EpisodeLink | null => {
          const num = $ep(el).attr("data-num") || "";
          if (!num) return null;

          const dataIds = $ep(el).attr("data-ids") || "";
          const malId = $ep(el).attr("data-mal") || "";
          const timestamp = $ep(el).attr("data-timestamp") || "";
          const hasSub = $ep(el).attr("data-sub") === "1";
          const hasDub = $ep(el).attr("data-dub") === "1";
          const rawTitle = $ep(el).attr("title") || "";
          const epTitle = rawTitle && rawTitle !== num ? `Episode ${num} - ${rawTitle}` : `Episode ${num}`;

          return {
            title: epTitle,
            link: JSON.stringify({
              slug,
              epNum: num,
              dataIds,
              malId,
              timestamp,
              hasSub,
              hasDub,
              title: epTitle,
            }),
          };
        };

        if (rangeUlList.length > 1) {
          // Multiple range groups (e.g. One Piece: 001-100, 101-200, etc.)
          rangeUlList.each((idx, ul) => {
            const rawRange = $ep(ul).attr("data-range") || "";
            let rangeLabel = rawRange;
            if (rawRange) {
              const parts = rawRange.split("-");
              const start = parseInt(parts[0], 10);
              const end = parseInt(parts[1], 10);
              if (!isNaN(start) && !isNaN(end)) {
                rangeLabel = `Episodes ${start}-${end}`;
              } else {
                rangeLabel = `Episodes ${rawRange}`;
              }
            } else {
              rangeLabel = `Season ${idx + 1}`;
            }

            const directLinks: EpisodeLink[] = [];
            $ep(ul).find("a").each((_, el) => {
              const ep = mapEpisode(el);
              if (ep) directLinks.push(ep);
            });

            if (directLinks.length > 0) {
              linkList.push({
                title: rangeLabel,
                directLinks,
              });
            }
          });
        } else {
          // Single list of episodes
          const allLinks: EpisodeLink[] = [];
          $ep("a[data-num]").each((_, el) => {
            const ep = mapEpisode(el);
            if (ep) allLinks.push(ep);
          });

          if (allLinks.length > 100) {
            // Split into 100-episode chunks for convenient season dropdown navigation
            for (let i = 0; i < allLinks.length; i += 100) {
              const chunk = allLinks.slice(i, i + 100);
              const start = i + 1;
              const end = Math.min(i + 100, allLinks.length);
              linkList.push({
                title: `Episodes ${start}-${end}`,
                directLinks: chunk,
              });
            }
          } else if (allLinks.length > 0) {
            linkList.push({
              title: "Season 1",
              directLinks: allLinks,
            });
          }
        }
      }
    }

    if (linkList.length === 0) {
      linkList.push({
        title: type === "movie" ? "Movie" : "Season 1",
        directLinks: [
          {
            title: type === "movie" ? "Movie" : "Episode 1",
            link: JSON.stringify({
              slug,
              epNum: "1",
              dataIds: "",
              malId: "",
              timestamp: "",
              hasSub: true,
              hasDub: false,
              title: type === "movie" ? "Movie" : "Episode 1",
            }),
            type: type as "movie" | "series",
          },
        ],
      });
    }

    return {
      title,
      synopsis,
      image,
      imdbId: "",
      type,
      tags: tags.length > 0 ? tags : undefined,
      rating,
      linkList,
      webUrl: watchUrl,
    };
  } catch (err) {
    throwProviderError("Anikoto", "metadata", err);
  }
};
