export interface Provider {
  id: string;
  name: string;
  displayName?: string;
  version?: string;
  icon?: string;
  region?: string;
  author?: string;
  endpoints: string[];
  hasCatalog: boolean;
  hasPosts: boolean;
  hasMeta: boolean;
  hasStream: boolean;
  hasEpisodes: boolean;
  hasSettings: boolean;
  url: string | null;
}

export interface Post {
  title: string;
  link: string;
  image: string;
  tag?: string;
  cornerTag?: string;
}

export interface CatalogCategory {
  title: string;
  filter: string;
}

export interface DirectLink {
  title: string;
  link: string;
  image?: string;
  type?: "movie" | "series";
}

export interface MetaLinkItem {
  title: string;
  episodesLink?: string;
  directLinks?: DirectLink[];
}

export interface MediaMeta {
  title: string;
  synopsis?: string;
  image?: string;
  poster?: string;
  imdbId?: string;
  type?: "movie" | "series";
  rating?: string;
  tags?: string[];
  linkList?: MetaLinkItem[];
  webUrl?: string;
}

export interface SubtitleTrack {
  title: string;
  language: string;
  type?: string;
  uri: string;
}

export interface MediaStream {
  server: string;
  link: string;
  type: string;
  quality?: string;
  subtitles?: SubtitleTrack[];
  headers?: Record<string, string>;
}

export interface Episode {
  title: string;
  link: string;
  image?: string;
  description?: string;
}

export interface WatchlistItem {
  id: string;
  title: string;
  image: string;
  link: string;
  provider: string;
  type: "movie" | "series";
  tag?: string;
  addedAt: number;
}

export interface ProviderHealth {
  status: "idle" | "testing" | "online" | "offline";
  latencyMs?: number;
  message?: string;
}
