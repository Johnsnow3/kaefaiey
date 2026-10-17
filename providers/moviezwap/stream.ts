import { ProviderContext, Stream } from "../types";

export async function getStream({
  link,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}) {
  const { axios, cheerio, commonHeaders: headers } = providerContext;
  const res = await axios.get(link, { headers, signal });
  const html = res.data;
  const $ = cheerio.load(html);
  const Streams: Stream[] = [];

  // Find all .mp4 / .mkv download links
  $('a:contains("Fast Download Server"), a:contains("Download Server"), a[href*=".mp4"], a[href*=".mkv"]').each((i, el) => {
    const href = $(el).attr("href");
    const label = $(el).text().trim() || `Download Server ${i + 1}`;
    if (href && (href.toLowerCase().includes(".mp4") || href.toLowerCase().includes(".mkv") || href.toLowerCase().includes("download"))) {
      const isM3u8 = href.toLowerCase().includes(".m3u8");
      Streams.push({
        link: href,
        type: isM3u8 ? "m3u8" : "mp4",
        server: label,
        headers: {
          ...headers,
          Referer: link.startsWith("http") ? link : "https://www.moviezwap.codes/",
          Origin: "https://www.moviezwap.codes",
        },
      });
    }
  });

  return Streams;
}
