import { ProviderContext, Stream } from "../types";
import { getBaseUrl } from "../getBaseUrl";
import { throwProviderError } from "../providerErrors";

export async function getStream({
  link,
  signal,
  providerContext,
}: {
  link: string;
  type?: string;
  signal?: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  const { cheerio } = providerContext;
  try {
    const baseUrl = await getBaseUrl("moviezwap");
    let target = link.startsWith("http") ? link : new URL(link, `${baseUrl}/`).href;

    // If direct video link already passed, return it cleanly
    if (
      target.toLowerCase().includes(".mp4") &&
      (target.includes("moviezzwaphd.xyz") || target.includes("10g"))
    ) {
      const cleanLink = encodeURI(decodeURI(target));
      return [
        {
          link: cleanLink,
          type: "mp4",
          server: "Fast Download Server",
          headers: {},
        },
      ];
    }

    // If dwload.php was passed, convert directly to download.php
    if (target.includes("dwload.php")) {
      target = target.replace("dwload.php", "download.php");
    }

    // If a movie detail page was passed, resolve the download page
    if (target.includes("/movie/")) {
      const movieRes = await fetch(target, { signal });
      if (movieRes.ok) {
        const $m = cheerio.load(await movieRes.text());
        const dlHref = $m('a[href*="download.php?file="], a[href*="dwload.php?file="]').attr("href");
        if (dlHref) {
          target = new URL(dlHref.replace("dwload.php", "download.php"), `${baseUrl}/`).href;
        }
      }
    }

    const res = await fetch(target, { signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    const streams: Stream[] = [];
    const seen = new Set<string>();

    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (!href) return;

      const isVideo =
        href.toLowerCase().includes(".mp4") ||
        href.toLowerCase().includes(".mkv") ||
        text.includes("Fast Download Server") ||
        text.includes("Download Server");

      if (isVideo) {
        const cleanHref = encodeURI(decodeURI(href));
        if (seen.has(cleanHref)) return;
        seen.add(cleanHref);

        const server =
          text.replace(/\s+/g, " ").trim() ||
          (cleanHref.toLowerCase().includes(".mkv") ? "MKV Download" : "Fast Download Server");

        streams.push({
          link: cleanHref,
          type: cleanHref.toLowerCase().includes(".mkv") ? "mkv" : "mp4",
          server,
          headers: {},
        });
      }
    });

    return streams;
  } catch (err) {
    throwProviderError("MoviezWap", "stream", err);
  }
}
