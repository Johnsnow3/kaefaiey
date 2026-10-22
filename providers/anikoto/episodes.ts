import { EpisodeLink, ProviderContext } from "../types";
import { getMeta } from "./meta";

export const getEpisodes = async function ({
  url,
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  try {
    const meta = await getMeta({
      link: url,
      providerContext,
    });

    if (!meta || !meta.linkList || meta.linkList.length === 0) {
      return [];
    }

    const allEpisodes: EpisodeLink[] = [];
    for (const group of meta.linkList) {
      if (group.directLinks && group.directLinks.length > 0) {
        allEpisodes.push(...group.directLinks);
      }
    }

    return allEpisodes;
  } catch (err) {
    console.error("Anikoto getEpisodes error:", err);
    return [];
  }
};
