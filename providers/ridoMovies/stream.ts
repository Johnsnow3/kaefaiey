import { ProviderContext, Stream } from "../types";
import { getBaseUrl } from "../getBaseUrl";

export const getStream = async ({
  link: data,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> => {
  try {
    const { cheerio, commonHeaders: headers, axios } = providerContext;
    let streamData: any = {};
    try {
      streamData = JSON.parse(data);
    } catch {
      streamData = { link: data };
    }

    const baseUrl =
      streamData?.baseUrl ||
      (await getBaseUrl("ridomovies").catch(() => "")) ||
      "https://ridomovies.tv";

    let slug = streamData?.slug || "";

    if (!slug) {
      const imdbMatch = String(data).match(/tt\d+/);
      const query = imdbMatch
        ? imdbMatch[0]
        : String(data).replace(/^https?:\/\/[^/]+\//, "").replace(/^\/+/, "").split("/")[0];
      if (query) {
        try {
          const searchRes = await axios.get(
            `${baseUrl}/core/api/search?q=${encodeURIComponent(query)}`,
            { headers }
          );
          slug = searchRes.data?.data?.items?.[0]?.fullSlug || "";
        } catch {}
      }
    }

    if (!slug) return [];

    const url = `${baseUrl}/api/${slug}`;
    console.log("rido url", url);

    const res = await axios.get(url, { headers });
    const iframe = res.data?.data?.[0]?.url || "";
    if (!iframe) return [];

    let iframeUrl = "";
    if (iframe.includes('src="')) {
      iframeUrl = iframe.split('src="')[1].split('"')[0];
    } else if (iframe.startsWith("http")) {
      iframeUrl = iframe;
    }
    if (!iframeUrl) return [];

    const iframeRes = await axios.get(iframeUrl, {
      headers: {
        ...headers,
        Referer: baseUrl,
      },
    });
    const $ = cheerio.load(iframeRes.data);
    const script = $('script:contains("eval")').html();
    if (!script) {
      throw new Error("Unable to find script");
    }
    // console.log('rido script', script);
    const srcUrl = unpackJavaScript(script.trim());
    console.log("rido srcUrl", srcUrl);

    streamLinks.push({
      link: srcUrl,
      server: "rido",
      type: "m3u8",
      headers: {
        Referer: iframeUrl,
      },
    });

    return streamLinks;
  } catch (e) {
    console.log("rido get stream err", e);
    return [];
  }
};

function unpackJavaScript(packedCode: string): string {
  const encodedString = packedCode.split("|aHR")[1].split("|")[0];
  const base64Url = "aHR" + encodedString;
  function addPadding(base64: string) {
    return base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  }

  console.log("rido base64Url", base64Url);
  const unpackedCode = atob(addPadding(base64Url));
  return unpackedCode;
}
