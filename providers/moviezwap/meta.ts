import { formatSeasonLinks } from "../formatSeasonLinks";
import { Info, Link, ProviderContext } from "../types";
import { getBaseUrl } from "../getBaseUrl";
import { throwProviderError } from "../providerErrors";

export const getMeta = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  try {
    const { cheerio } = providerContext;
    const baseUrl = await getBaseUrl("moviezwap");
    const url = new URL(link, `${baseUrl}/`).href;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.text();
    const $ = cheerio.load(data);

    // 1. Poster image
    let image = $('img[width="260"]').attr("src") || "";
    if (image && !image.startsWith("http")) {
      image = new URL(image, `${baseUrl}/`).href;
    }

    const tags = $("font[color='steelblue']")
      .map((i, el) => $(el).text().trim())
      .get()
      .slice(0, 2);

    // 2. Title
    const title = $("title").text().replace(" - MoviezWap", "").trim() || "";

    // 3. Category & Media Type
    const categoryText = $("div.movie:contains('Category')").text() || "";
    const isSeries =
      categoryText.toLowerCase().includes("series") ||
      title.toLowerCase().includes("season") ||
      title.toLowerCase().includes("episode") ||
      title.toLowerCase().includes("eps");
    const type = isSeries ? "series" : "movie";

    // 4. Info table
    let synopsis = "";
    let imdbId = "";
    let infoRows: string[] = [];
    $("td:contains('Movie Information')")
      .parent()
      .nextAll("tr")
      .each((i, el) => {
        const tds = $(el).find("td");
        if (tds.length === 2) {
          const key = tds.eq(0).text().trim();
          const value = tds.eq(1).text().trim();
          infoRows.push(`${key}: ${value}`);
          if (key.toLowerCase().includes("plot")) synopsis = value;
          if (key.toLowerCase().includes("imdb")) imdbId = value;
        }
      });
    if (!synopsis) {
      synopsis = $("p:contains('plot')").text().trim();
    }

    // 5. Download links (qualities)
    const links: Link[] = [];
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
        const text = $(el).text().trim() || `Quality ${links.length + 1}`;

        links.push({
          title: text,
          episodesLink: downloadPage,
          directLinks: [
            {
              title: "Play",
              link: downloadPage,
            },
          ],
        });
      },
    );

    return {
      title,
      synopsis,
      image,
      imdbId,
      tags,
      type,
      linkList: formatSeasonLinks(links),
      webUrl: url,
    };
  } catch (err) {
    throwProviderError("MoviezWap", "metadata", err);
  }
};
