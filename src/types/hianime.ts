import { t } from "elysia";

export const hianimeAnimeStatus = t.UnionEnum(["finished-airing", "currently-airing", "not-yet-aired"])
export const hianimeAnimeSeasons = t.UnionEnum(["spring", "fall", "summer", "winter"])
export const hianimeAnimeType = t.UnionEnum(['movie', 'tv', 'ova', 'ona', 'special', 'music'])

export const hianimeAnimeEpisode = t.Object({
  number: t.Number(),
  title: t.String(),
  episodeId: t.String(),
  isFiller: t.Boolean(),
})

export const hianimeAnimeEpisodeStreamingLink = t.Object({
  headers: t.Object({
    Referer: t.String()
  }),
  tracks: t.Array(
    t.Object({
      file: t.String(),
      label: t.Optional(t.String()),
      kind: t.UnionEnum(['captions', 'thumbnails', 'chapters']),
      default: t.Optional(t.Boolean())
    })
  ),
  intro: t.Object({
    start: t.Number(),
    end: t.Number()
  }),
  outro: t.Object({
    start: t.Number(),
    end: t.Number()
  }),
  sources: t.Array(t.Object({
    url: t.String(),
    type: t.String()
  })),
  anilistId: t.Optional(t.Number()),
  malId: t.Optional(t.Number())
})

export const hianimeAnimeData = t.Object({
  id: t.String(),
  name: t.String(),
  jname: t.String(),
  poster: t.String(),
  duration: t.String(),
  type: hianimeAnimeType,
  rating: t.String(),
  episodes: t.Object({
    sub: t.Number(),
    dub: t.Number(),
  })
})

export const hianimeResponse = t.Object({
  animes: t.Array(hianimeAnimeData),
  mostPopularAnimes: t.Array(hianimeAnimeData),
  searchFilters: t.Object({
    genres: t.String(),
    type: hianimeAnimeType,
    status: hianimeAnimeStatus,
    season: hianimeAnimeSeasons,
    sort: t.String(),
    language: t.UnionEnum(['sub', 'dub']),
    score: t.String(),
  }),
  totalPages: t.Number(),
  hasNextPage: t.Boolean(),
  currentPage: t.Number()
})

export type HianimeAnimeEpisodeStreamingLink = typeof hianimeAnimeEpisodeStreamingLink.static
export type HianimeAnimeData = typeof hianimeAnimeData.static
export type HianimeAnimeEpisode = typeof hianimeAnimeEpisode.static
export type HianimeResponse = typeof hianimeResponse.static
export type HianimeAnimeStatus = typeof hianimeAnimeStatus.static
export type HianimeAnimeSeason = typeof hianimeAnimeSeasons.static
export type HianimeAnimeType = typeof hianimeAnimeType.static
export type HianimeAnimeEpisodesResponse = {
  totalEpisodes: Number,
  episodes: HianimeAnimeEpisode[]
}