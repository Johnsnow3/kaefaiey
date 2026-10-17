import { AxiosInstance } from "axios";

export async function transferitExtractor(
  transferId: string,
  axios: AxiosInstance,
  userAgent?: string
): Promise<string | null> {
  try {
    const res = await axios.get(`https://transfer.it/api/file/${transferId}`, {
      headers: {
        "User-Agent":
          userAgent ||
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `https://transfer.it/t/${transferId}`,
      },
      timeout: 10000,
    });
    if (res.data?.downloadUrl) return res.data.downloadUrl;
    if (res.data?.url) return res.data.url;
    return `https://transfer.it/download/${transferId}`;
  } catch {
    return `https://transfer.it/download/${transferId}`;
  }
}
