import { Post, ProviderContext } from "../types";
import { getBaseUrl } from "../getBaseUrl";

export const getPosts = async function ({
  filter,
  page,
  // providerValue,
  signal,
  providerContext,
}: {
  filter: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const { axios, cheerio } = providerContext;
  const baseURL = await getBaseUrl("tokyoinsider");
  const start = page < 2 ? 0 : (page - 1) * 20;
  const url = `${baseURL}/${filter}&start=${start}`;
  return posts({ baseURL, url, signal, axios, cheerio, headers: providerContext.commonHeaders });
};

export const getSearchPosts = async function ({
  searchQuery,
  page,
  // providerValue,
  signal,
  providerContext,
}: {
  searchQuery: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const { axios, cheerio } = providerContext;
  const baseURL = await getBaseUrl("tokyoinsider");
  const start = page < 2 ? 0 : (page - 1) * 20;
  const url = `${baseURL}/anime/search?k=${searchQuery}&start=${start}`;
  return posts({ baseURL, url, signal, axios, cheerio, headers: providerContext.commonHeaders });
};

async function posts({
  baseURL,
  url,
  signal,
  axios,
  cheerio,
  headers = {},
}: {
  baseURL: string;
  url: string;
  signal: AbortSignal;
  axios: ProviderContext["axios"];
  cheerio: ProviderContext["cheerio"];
  headers?: Record<string, string>;
}): Promise<Post[]> {
  try {
    const res = await axios.get(url, {
      signal,
      headers: {
        ...headers,
        Referer: `${baseURL}/`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];

    // Check table rows first
    const rows = $("tr:has(.a_img), tr:has(td.c_h2)");
    if (rows.length > 0) {
      rows.each((i, row) => {
        const imgEl = $(row).find(".a_img, img").first();
        const rawImg = imgEl.attr("src") || "";
        const image = rawImg.startsWith("http")
          ? rawImg.replace("small", "default")
          : `${baseURL}/${rawImg.replace(/^\/+/, "").replace("small", "default")}`;

        const anchor = $(row).find("a[href*='/anime/']").last().length
          ? $(row).find("a[href*='/anime/']").last()
          : $(row).find("a").first();

        const title = anchor.attr("title")?.trim() || anchor.text().trim();
        const href = anchor.attr("href") || "";
        const link = href.startsWith("http")
          ? href
          : `${baseURL}/${href.replace(/^\/+/, "")}`;

        if (title && href && image) {
          catalog.push({ title, link, image });
        }
      });
    }

    if (catalog.length === 0) {
      $('td.c_h2').each((i, element) => {
        const image = $(element)
          .find(".a_img, img")
          .attr("src")
          ?.replace("small", "default");
        const a = $(element).find("a").first();
        const title = a.attr("title")?.trim() || a.text().trim();
        const href = a.attr("href") || "";
        const link = href.startsWith("http") ? href : `${baseURL}/${href.replace(/^\/+/, "")}`;
        if (title && href && image) {
          catalog.push({
            title,
            link,
            image: image.startsWith("http") ? image : `${baseURL}/${image.replace(/^\/+/, "")}`,
          });
        }
      });
    }

    return catalog;
  } catch (err) {
    return [];
  }
}
