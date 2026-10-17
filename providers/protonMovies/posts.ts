import { Post, ProviderContext } from "../types";
import { getBaseUrl } from "../getBaseUrl";

export const getPosts = async function ({
  filter,
  page,
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
  const baseUrl = await getBaseUrl("protonMovies");
  const url = `${baseUrl + filter}/page/${page}/`;
  return posts({ url, baseUrl, signal, axios, cheerio });
};

export const getSearchPosts = async function ({
  searchQuery,
  page,
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
  const baseUrl = await getBaseUrl("protonMovies");
  const url = `${baseUrl}/search/${searchQuery}/page/${page}/`;
  return posts({ url, baseUrl, signal, axios, cheerio });
};

async function posts({
  url,
  baseUrl,
  signal,
  axios,
  cheerio,
}: {
  url: string;
  baseUrl: string;
  signal: AbortSignal;
  axios: ProviderContext["axios"];
  cheerio: ProviderContext["cheerio"];
}): Promise<Post[]> {
  try {
    function decodeHtml(encodedArray: string[]): string {
      // Join array elements into a single string
      const joined = encodedArray.join("");

      // Replace escaped quotes
      const unescaped = joined.replace(/\\"/g, '"').replace(/\\'/g, "'");

      // Remove remaining escape characters
      const cleaned = unescaped
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r");

      // Convert literal string representations back to characters
      const decoded = cleaned
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");

      return decoded;
    }
    const res = await axios.get(url, {
      headers: {
        referer: baseUrl,
      },
      signal,
    });
    const data = res.data;
    let html = typeof data === "string" ? data : "";
    const regex = /\[(?=.*?"<div class")(.*?)\]/g;
    const htmlArray = typeof data === "string" ? data.match(regex) : null;
    if (htmlArray && htmlArray.length > 0) {
      try {
        html = decodeHtml(JSON.parse(htmlArray[htmlArray.length - 1]));
      } catch {}
    }
    const $ = cheerio.load(html);
    const catalog: Post[] = [];
    $(".col.mb-4, .movie-card, .film-item, .card, article, .item").map((i, element) => {
      const title = $(element).find("h5, .title, .film-name, h2, h3").first().text().trim();
      const link = $(element).find("h5 a, a.film-poster, a").first().attr("href");
      const image =
        $(element).find("img").attr("data-src") ||
        $(element).find("img").attr("src") ||
        "";
      if (title && link) {
        catalog.push({
          title: title,
          link: link,
          image: image || "",
        });
      }
    });
    return catalog;
  } catch (err) {
    console.error("protonGetPosts error ", err);
    return [];
  }
}
