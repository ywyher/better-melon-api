import { t } from "elysia";

export const hianimeAnimeStatus = t.UnionEnum(["finished-airing", "currently-airing", "not-yet-aired"])
export const hianimeAnimeSeasons = t.UnionEnum(["spring", "fall", "summer", "winter"])
export const hianimeAnimeType = t.UnionEnum(['movie', 'tv', 'ova', 'ona', 'special', 'music'])

export type HianimeAnimeStatus = typeof hianimeAnimeStatus.static
export type HianimeAnimeSeason = typeof hianimeAnimeSeasons.static
export type HianimeAnimeType = typeof hianimeAnimeType.static