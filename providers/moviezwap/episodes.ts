import { EpisodeLink, ProviderContext } from "../types";
import { getBaseUrl } from "../getBaseUrl";
import { throwProviderError } from "../providerErrors";

export const getEpisodes = async function ({
  url,
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  const { cheerio } = providerContext;
  try {
    const baseUrl = await getBaseUrl("moviezwap");
    const fullUrl = url.startsWith("http") ? url : new URL(url, `${baseUrl}/`).href;

    // If already a download or dwload link
    if (fullUrl.includes("download.php") || fullUrl.includes("dwload.php")) {
      const targetUrl = fullUrl.replace("dwload.php", "download.php");
      return [
        {
          title: "Play",
          link: targetUrl,
        },
      ];
    }

    // If it is a movie detail page
    const res = await fetch(fullUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const episodeLinks: EpisodeLink[] = [];
    const seenFiles = new Set<string>();

    $('a[href*="download.php?file="], a[href*="dwload.php?file="]').each(
      (i, el) => {
        const rawHref = $(el).attr("href") || "";
        const fileMatch = rawHref.match(/file=(\d+)/);
        if (!fileMatch) return;
        const fileId = fileMatch[1];
        if (seenFiles.has(fileId)) return;
        seenFiles.add(fileId);

        const downloadPage = new URL(`/download.php?file=${fileId}`, `${baseUrl}/`).href;
        let text = $(el).text().trim() || `Play ${episodeLinks.length + 1}`;
        if (text.includes("Download page")) {
          text = "Play";
        }

        episodeLinks.push({
          title: text,
          link: downloadPage,
        });
      },
    );

    return episodeLinks;
  } catch (err) {
    throwProviderError("MoviezWap", "episodes", err);
  }
};
