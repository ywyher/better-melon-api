import { env } from "../env";
import { ErrorResponse, SuccessResponse } from "../types";
import { AnilistAnimeData, AnilistAnimeFormat, AnilistAnimeStatus } from "../types/anilist";
import { HianimeAnimeData, HianimeAnimeEpisodesResponse, HianimeAnimeEpisodeStreamingLink, hianimeAnimeStatus, HianimeAnimeStatus, hianimeAnimeType, HianimeAnimeType, HianimeResponse } from "../types/hianime";
import { createError, isErrorResponse } from "../utils";
import { getAnilistAnime } from "./anilist";

function mapAnilistToHiAnime(anilistData: AnilistAnimeData) {
  const data = anilistData.Media;
  const format = data.format;
  const status = data.status;
  const season = data.season.toLowerCase();
  const genres = data.genres.map((g) => g.toLowerCase()).join(',')
  const startDate = data.startDate;
  const endDate = data.endDate;
  const title = data.title.english

  const formatMapping: Record<AnilistAnimeFormat, HianimeAnimeType | null> = {
    "TV": "tv",
    "TV_SHORT": "tv",
    "MOVIE": "movie",
    "SPECIAL": "special",
    "OVA": "ova",
    "ONA": "ona",
    "MUSIC": "music",
  };
  const mappedType = formatMapping[format];
  if (!mappedType) {
    createError(`Invalid type: ${format}. Valid HiAnime types are: ${Object.keys(hianimeAnimeType.enum).join(', ')}`)
  }

  const statusMapping: Record<AnilistAnimeStatus, HianimeAnimeStatus | null> = {
    'FINISHED': 'finished-airing',
    "RELEASING": 'currently-airing',
    'NOT_YET_RELEASED': 'not-yet-aired',
    'CANCELLED': null,
    "HIATUS": null
  }
  const mappedStatus = statusMapping[status];
  if (!mappedStatus) {
    return createError(`Invalid status: ${status}. Valid HiAnime statuss are: ${Object.keys(hianimeAnimeStatus.enum).join(', ')}`)
  }

  return {
    q: title,
    success: true,
    type: mappedType,
    status: mappedStatus,
    genres,
    season,
    startDate: `${startDate.year}-${startDate.month}-${startDate.day}`,
    endDate: `${endDate.year}-${endDate.month}-${endDate.day}`
  };
}

async function getHianimeAnimeInfo(anilistData: AnilistAnimeData): Promise<HianimeAnimeData | ErrorResponse> {
  try {
    const mapped = mapAnilistToHiAnime(anilistData)
    if(isErrorResponse(mapped)) return mapped;
    const { endDate, genres, q, season, startDate, status, type } = mapped

    const hianimeDataRaw = await fetch(`${env.ANIWATCH_URL}/search?q=${q}&genres=${genres}&type=${type}&status=${status}&startDate=${startDate}&endDate=${endDate}&season=${season}&sort=score&language=sub&score=good`)
    if(!hianimeDataRaw.ok) throw new Error(`Error while fetching hianime data: ${hianimeDataRaw.status} ${hianimeDataRaw.statusText}`)
      
    const hianimeData = await hianimeDataRaw.json() as SuccessResponse<HianimeResponse>;

    const anime = hianimeData.data.animes[0]

    return anime;
  } catch (error) {
    return createError(`Failed to fetch hianime anime data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function getHianimeAnimeEpisodeStreamingLinks(animeId: HianimeAnimeData['id'], episodeNumber: string): Promise<HianimeAnimeEpisodeStreamingLink[] | ErrorResponse> {
  try {
    const episodesRaw = await fetch(`${process.env.ANIWATCH_URL}/anime/${animeId}/episodes`)
    const { data: episodesData } = await episodesRaw.json() as SuccessResponse<HianimeAnimeEpisodesResponse>;

    const episode = episodesData.episodes.find(e => e.number === Number(episodeNumber))
    if(!episode) throw new Error("Couldn't find hianime anime episode data")

    const linksRaw = await fetch(`${process.env.ANIWATCH_URL}/episode/sources?animeEpisodeId=${episode.episodeId}&category=sub`)
    if(!linksRaw.ok) throw new Error(`Error while fetching hianime anime episode streaming links: ${linksRaw.status} ${linksRaw.statusText}`)

    const links = await linksRaw.json() as SuccessResponse<HianimeAnimeEpisodeStreamingLink[]>

    return links.data
  }catch (error) {
    return createError(`Failed to fetch hianime anime episode streaming links: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getHianimeAnime(anilistId: string, episodeNumber: string): Promise<any | ErrorResponse> {
  try {
    const anilistData = await getAnilistAnime(anilistId)

    if(isErrorResponse(anilistData)) {
      return anilistData;
    }

    const animeData = await getHianimeAnimeInfo(anilistData);

    if(isErrorResponse(animeData)) {
      return animeData
    }
    
    const links = await getHianimeAnimeEpisodeStreamingLinks(animeData.id, episodeNumber)
    
    if(isErrorResponse(links)) {
      return links
    }

    return {
      info: animeData,
      episode: links
    };
  } catch (error) {
    return createError(`Failed to fetch hianime data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}