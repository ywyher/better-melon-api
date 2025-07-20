import { redis } from "bun";
import { AnilistAnimeData, AnilistAnimeStatus, AnilistNextAiringEpisode } from "../types/anilist";
import { KitsuApiResponse, KitsuAnimeInfo, KitsuAnimeEpisode, KitsuAnimeStatus, AnilistToKitsu, kitsuAnimeStatus } from "../types/kitsu";
import { env } from "../lib/env";
import { makeRequest } from "../utils/utils";
import { cacheKeys } from "../lib/constants/cache";

async function mapAnilistToKitsu(anilistData: AnilistAnimeData): Promise<AnilistToKitsu> {
  const startTime = performance.now();
  
  try {
    const status = anilistData.status;
    const startDate = anilistData.startDate;
    const endDate = anilistData.endDate;
    const title = anilistData.title.english.toLowerCase().replace(/\s+/g, '+');
    
    const statusMapping: Record<AnilistAnimeStatus, KitsuAnimeStatus | null> = {
      'FINISHED': 'finished',
      "RELEASING": 'current',
      'NOT_YET_RELEASED': 'unreleased',
      'CANCELLED': null,
      "HIATUS": null
    }
    const mappedStatus = statusMapping[status] as KitsuAnimeStatus;
    if (!mappedStatus) {
      throw new Error(`Invalid status: ${status}. Valid Kitsu statuss are: ${Object.keys(kitsuAnimeStatus.enum).join(', ')}`)
    }

    const pad = (n: number) => n ? String(n).padStart(2, '0') : undefined;

    const result = {
      q: title.replace('+', ' '),
      success: true,
      status: mappedStatus,
      startDate: `${startDate.year}-${pad(startDate.month)}-${pad(startDate.day)}`,
      endDate: mappedStatus == 'finished' ? `${endDate.year}-${pad(endDate.month)}-${pad(endDate.day)}` : null
    }

    const endTime = performance.now();
    console.log(`mapAnilistToHiKitsu execation time: ${(endTime - startTime).toFixed(2)}ms`);

    return result;
  } catch (error) {
    const endTime = performance.now();
    console.log(`mapAnilistToHiKitsu failed after ${(endTime - startTime).toFixed(2)}ms`);
    throw new Error(`Failed to map Anilist to Kitsu: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getKitsuAnimeInfo(anilistData: AnilistAnimeData): Promise<KitsuAnimeInfo> {
  try {
    const cacheKey = cacheKeys.kitsu.info(anilistData.id);
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for kitsu anime ID: ${anilistData.id}`);
      return JSON.parse(cachedData as string) as KitsuAnimeInfo;
    }

    const mapped = await mapAnilistToKitsu(anilistData);
    const { endDate, q, startDate, status } = mapped;

    const { data: { data } } = await makeRequest<KitsuApiResponse<KitsuAnimeInfo[]>>(`
      ${env.KITSU_API_URL}/anime?filter[text]=${q}&filter[status]=${status}
    `, {
      name: 'kitsu-anime-info',
      benchmark: true,
      headers: {
       'Accept': 'application/vnd.api+json',
       'Content-Type': 'application/vnd.api+json'
     }
    })

    if (!data?.length) {
      throw new Error(`No anime found on Kitsu for: ${q}`);
    }

    const anime = data.find((anime) => {
      if(endDate) {
        return anime.attributes.startDate == startDate
        && anime.attributes.endDate == endDate
      }else {
        return anime.attributes.startDate == startDate
      }
    })

    await redis.set(cacheKey, JSON.stringify(anime || data[0]), "EX", 3600);
    console.log(`Cached kitsu anime info for ID: ${anilistData.id}`);
    return anime || data[0]
  } catch (error) {
    console.error(`Error fetching kitsu data for ${anilistData.id}:`, error);
    throw new Error(`${error instanceof Error ? error.message : 'Failed to fetch kitsu anime data: Unknown error'}`);
  }
}

export async function getKitsuAnimeEpisodes({
  kitsuAnimeId,
  nextAiringEpisode
}: {
  kitsuAnimeId: KitsuAnimeInfo['id']
  nextAiringEpisode: AnilistNextAiringEpisode | null
}): Promise<KitsuAnimeEpisode[]> {
  try {
    const cacheKey = cacheKeys.kitsu.episodes(kitsuAnimeId);
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache hit for kitsu episodes, anime ID: ${kitsuAnimeId}`);
      return JSON.parse(cachedData as string) as KitsuAnimeEpisode[];
    }

    const allEpisodes: KitsuAnimeEpisode[] = [];
    let offset = 0;
    const limit = 20; // Maximum allowed by Kitsu
    let hasMorePages = true;

    while (hasMorePages) {
      const { data: { data, meta } } = await makeRequest<KitsuApiResponse<KitsuAnimeEpisode[]>>(`
        ${env.KITSU_API_URL}/anime/${kitsuAnimeId}/episodes?page[limit]=${limit}&page[offset]=${offset}
      `, 
      {
        name: 'kitsu-anime-episodes',
        benchmark: true,
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json'
        }
      });

      if (!data?.length) {
        if (offset === 0) {
          throw new Error(`No episodes found on Kitsu for anime ID: ${kitsuAnimeId}`);
        }
        break; // No more episodes to fetch
      }

      // Filter out episodes after nextAiringEpisode if it exists
      const filteredData = nextAiringEpisode 
        ? data.filter(episode => episode.attributes?.number && episode.attributes.number < nextAiringEpisode.episode)
        : data;

      allEpisodes.push(...filteredData);

      // If we filtered out episodes, we might need to stop early
      if (nextAiringEpisode && filteredData.length < data.length) {
        console.log(`Stopped fetching at episode ${nextAiringEpisode.episode - 1} due to nextAiringEpisode limit`);
        break;
      }

      // Check if there are more pages
      offset += limit;
      
      // Multiple ways to determine if there are more pages:
      if (meta?.count) {
        // If total count is available
        hasMorePages = offset < meta.count;
      } else if (data.length < limit) {
        // If we got fewer episodes than the limit, we've reached the end
        hasMorePages = false;
      } else {
        // Fallback: assume there might be more if we got exactly the limit
        hasMorePages = data.length === limit;
      }

      console.log(`Fetched ${data.length} episodes (${allEpisodes.length}/${meta.count || '?'} total)`);
    }

    console.log(`Successfully fetched all ${allEpisodes.length} episodes for anime ID: ${kitsuAnimeId}`);

    // Set cache TTL based on nextAiringEpisode
    const cacheTtl = nextAiringEpisode 
      ? Math.max(nextAiringEpisode.timeUntilAiring, 60) // Minimum 60 seconds to avoid too frequent updates
      : 3600;

    await redis.set(cacheKey, JSON.stringify(allEpisodes), "EX", cacheTtl);
    console.log(`Cached kitsu episodes for anime ID: ${kitsuAnimeId} with TTL: ${cacheTtl}s`);

    return allEpisodes;
  } catch (error) {
    console.error(`Error fetching kitsu episodes for ${kitsuAnimeId}:`, error);
    throw new Error(`${error instanceof Error ? error.message : 'Failed to fetch kitsu anime episodes: Unknown error'}`);
  }
}