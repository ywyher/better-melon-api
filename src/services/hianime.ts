import { env } from "../lib/env";
import { AnilistAnimeData, AnilistAnimeFormat, AnilistAnimeStatus } from "../types/anilist";
import { AnilistToHiAnime, HianimeAnimeData, HianimeAnimeEpisodesResponse, hianimeAnimeEpisodeStreamingLink, HianimeAnimeEpisodeStreamingLink, hianimeAnimeResponse, HianimeAnimeResponse, hianimeAnimeStatus, HianimeAnimeStatus, hianimeAnimeType, HianimeAnimeType, HianimeApiResponse, HianimeSearchResponse } from "../types/hianime";
import { makeRequest } from "../utils/utils";
import { getAnilistAnime } from "./anilist";

async function mapAnilistToHiAnime(anilistData: AnilistAnimeData): Promise<AnilistToHiAnime> {
  const startTime = performance.now();
  
  try {
    const format = anilistData.format;
    const status = anilistData.status;
    const season = anilistData.season.toLowerCase() as AnilistToHiAnime['season'];
    const startDate = anilistData.startDate;
    const endDate = anilistData.endDate;
    const title = anilistData.title.english.toLowerCase().replace(/\s+/g, '+');
    
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
      throw new Error(`Invalid type: ${format}. Valid HiAnime types are: ${Object.keys(hianimeAnimeType.enum).join(', ')}`)
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
      throw new Error(`Invalid status: ${status}. Valid HiAnime statuss are: ${Object.keys(hianimeAnimeStatus.enum).join(', ')}`)
    }

    const result = {
      q: title,
      success: true,
      type: mappedType,
      status: mappedStatus,
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
    throw new Error(`Failed to map Anilist to HiAnime: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getHianimeAnimeInfo(anilistData: AnilistAnimeData): Promise<HianimeAnimeData> {
  try {
    const mapped = await mapAnilistToHiAnime(anilistData);
    const { endDate, q, season, startDate, status, type } = mapped

    const { data: { data: hianimeData } } = await makeRequest<HianimeApiResponse<HianimeSearchResponse>>(
      `${env.ANIWATCH_URL}/search?q=${q}&type=${type}&status=${status}&startDate=${startDate}&endDate=${endDate}&language=sub`,
      { benchmark: true, name: "hianime-search" }
    )

    const anime = hianimeData.animes[0];

    return anime;
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : 'Failed to fetch hianime anime data: Unknown error'}`);
  }
}

async function getHianimeAnimeEpisodeStreamingLinks(animeId: HianimeAnimeData['id'], episodeNumber: string): Promise<HianimeAnimeEpisodeStreamingLink> {
  try {
    const { data: { data: episodes } } = await makeRequest<HianimeApiResponse<HianimeAnimeEpisodesResponse>>(
      `${env.ANIWATCH_URL}/anime/${animeId}/episodes`,
      { benchmark: true, name: 'hianime-episodes' }
    );
    
    const episode = episodes.episodes.find(e => e.number === Number(episodeNumber));
    if(!episode) throw new Error("Couldn't find hianime anime episode data")

    const { data: { data: links } } = await makeRequest<HianimeApiResponse<HianimeAnimeEpisodeStreamingLink>>(
      `${env.ANIWATCH_URL}/episode/sources?animeEpisodeId=${episode.episodeId}&category=sub`,
      { benchmark: true, name: 'hianime-streaming-links' }
    );
    
    return links;
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : 'Failed to fetch hianime anime episode streaming links: Unknown error'}`);
  }
}

export async function getHianimeAnime(anilistId: string, episodeNumber: string): Promise<HianimeAnimeResponse> {
  console.log(`Starting getHianimeAnime for anilistId: ${anilistId}, episodeNumber: ${episodeNumber}`);
  
  try {
    console.log('Fetching anilist anime data...');
    const anilistAnimeData = await getAnilistAnime(anilistId);
    console.log('Successfully fetched anilist anime data');
    
    console.log('Fetching hianime anime info...');
    const animeData = await getHianimeAnimeInfo(anilistAnimeData);
    if(!animeData) {
      console.error('No anime data found from HiAnime');
      throw new Error("Couldn't find anime data from HiAnime");
    }
    console.log(`Successfully fetched hianime info for ID: ${animeData.id}`);
    
    console.log('Fetching streaming links...');
    const links = await getHianimeAnimeEpisodeStreamingLinks(animeData.id, episodeNumber);
    console.log('Successfully fetched streaming links');

    return {
      details: anilistAnimeData,
      streamingLinks: links
    };
  } catch (error) {
    console.error('Error in getHianimeAnime:', error);
    throw new Error(`${error instanceof Error ? error.message : 'Failed to fetch hianime data: Unknown error'}`);
  }
}