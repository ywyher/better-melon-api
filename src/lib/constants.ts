import { animeProvider } from "../types";
import { index } from "../types/meilisearch";

export const animeProviders = animeProvider.enum
export const indexes = index.enum

export const cacheKeys = {
  anilist: {
    // anilist:anime:${anilistId}
    anime: "anilist:anime"
  },
  hianime: {
    // hianime:info:${anilistId}
    info: "hianime:info",
    // hianime:episodes:${hianimeAnimeId}
    episodes: "hianime:episodes",
    // hianime:sources:${hianimeAnimeEpisodeId}
    sources: "hianime:sources"
  },
  jimaku: {
    // jimaku:entries:${anilistId}
    entries: "jimaku:entries",
    // jimaku:files:${anilistId}
    files: "jimaku:files"
  }
}