import { env } from "../lib/env";
import { ApiResponse, ErrorResponse, SuccessResponse } from "../types";
import { AnilistAnimeData, AnilistAnimeFormat, AnilistAnimeStatus } from "../types/anilist";
import { HianimeAnimeData, HianimeAnimeEpisodesResponse, hianimeAnimeEpisodeStreamingLink, HianimeAnimeEpisodeStreamingLink, hianimeAnimeStatus, HianimeAnimeStatus, hianimeAnimeType, HianimeAnimeType, HianimeResponse } from "../types/hianime";
import { assertSuccess, createError, isErrorResponse, makeRequest } from "../lib/utils";
import { getAnilistAnime } from "./anilist";
import axios, { AxiosResponse } from "axios";

function mapAnilistToHiAnime(anilistData: AnilistAnimeData) {
  const startTime = performance.now();
  
  try {
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
      return createError(`Invalid type: ${format}. Valid HiAnime types are: ${Object.keys(hianimeAnimeType.enum).join(', ')}`)
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

    const result = {
      q: title,
      success: true,
      type: mappedType,
      status: mappedStatus,
      genres,
      season,
      startDate: `${startDate.year}-${startDate.month}-${startDate.day}`,
      endDate: `${endDate.year}-${endDate.month}-${endDate.day}`
    }

    const endTime = performance.now();
    console.log(`mapAnilistToHiAnime execution time: ${(endTime - startTime).toFixed(2)}ms`);

    return result;
  } catch (error) {
    const endTime = performance.now();
    console.log(`mapAnilistToHiAnime failed after ${(endTime - startTime).toFixed(2)}ms`);
    
    return createError(`Failed to map Anilist to HiAnime: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getHianimeAnimeInfo(anilistData: AnilistAnimeData): Promise<HianimeAnimeData | ErrorResponse> {
  try {
    const mapped = mapAnilistToHiAnime(anilistData);
    assertSuccess(mapped)
    const { endDate, genres, q, season, startDate, status, type } = mapped;
    
    const { data: { data: hianimeData } } = await axios.get<SuccessResponse<HianimeResponse>>(
      `${env.ANIWATCH_URL}/search?q=${q}&genres=${genres}&type=${type}&status=${status}&startDate=${startDate}&endDate=${endDate}&season=${season}&sort=score&language=sub&score=good`,
    )
    assertSuccess(hianimeData)
    const anime = hianimeData.animes[0];

    return anime;
  } catch (error) {
    return createError(`${error instanceof Error ? error.message : 'Failed to fetch hianime anime data: Unknown error'}`);
  }
}

async function getHianimeAnimeEpisodeStreamingLinks(animeId: HianimeAnimeData['id'], episodeNumber: string): Promise<HianimeAnimeEpisodeStreamingLink[] | ErrorResponse> {
  try {
    const { data: { data: episodes } } = await makeRequest<SuccessResponse<HianimeAnimeEpisodesResponse>>(
      `${env.ANIWATCH_URL}/anime/${animeId}/episodes`,
      { benchmark: true, name: 'hianime-episodes' }
    );

    assertSuccess(episodes)
    
    const episode = episodes.episodes.find(e => e.number === Number(episodeNumber));
    if(!episode) throw new Error("Couldn't find hianime anime episode data");

    const { data: { data: links } } = await makeRequest<SuccessResponse<HianimeAnimeEpisodeStreamingLink[]>>(
      `${env.ANIWATCH_URL}/episode/sources?animeEpisodeId=${episode.episodeId}&category=sub`,
      { benchmark: true, name: 'hianime-streaming-links' }
    );

    assertSuccess(links)
    
    return links;
  } catch (error) {
    return createError(`${error instanceof Error ? error.message : 'Failed to fetch hianime anime episode streaming links: Unknown error'}`);
  }
}

export async function getHianimeAnime(anilistId: string, episodeNumber: string): Promise<any | ErrorResponse> {
  try {
    const anilistData = await getAnilistAnime(anilistId);
    assertSuccess(anilistData)

    const animeData = await getHianimeAnimeInfo(anilistData);
    assertSuccess(animeData)

    const links = await getHianimeAnimeEpisodeStreamingLinks(animeData.id, episodeNumber);
    assertSuccess(links)

    const result = {
      details: animeData,
      streamingLinks: links
    };

    return result;
  } catch (error) {
    return createError(`${error instanceof Error ? error.message : 'Failed to fetch hianime data: Unknown error'}`);
  }
}