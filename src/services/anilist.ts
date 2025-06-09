import { AnilistAnimeData, AnilistAnimeResponse } from "../types/anilist"
import { makeRequest } from "../utils/utils";
import { env } from "../lib/env";
import { redis } from "bun";
import { cacheKeys } from "../lib/constants";

export async function getAnilistAnime(anilistId: AnilistAnimeData['id']): Promise<AnilistAnimeData> {
  try {
    const cacheKey = `${cacheKeys.anilist.anime}:${anilistId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for anilist anime ID: ${anilistId}`);
      return JSON.parse(cachedData as string) as AnilistAnimeData;
    }
    
    const { data: { data: anilistAnimeData } } = await makeRequest<AnilistAnimeResponse>(
      env.ANILIST_URL,
      {
        benchmark: true,
        name: 'anilist',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `
            query {
              Media(id: ${anilistId}) {
                id
                idMal
                bannerImage
                coverImage {
                  large
                  medium
                }
                title {
                  english
                }
                format
                episodes
                nextAiringEpisode {
                  episode
                  timeUntilAiring
                }
                description
                genres
                status
                season
                seasonYear
                startDate {
                  year
                  month
                  day
                }
                endDate {
                  year
                  month
                  day
                }
                averageScore
                isAdult
              } 
            }
          `,
        }
      }, 
    );

    const animeData = anilistAnimeData.Media;
    
    await redis.set(cacheKey, JSON.stringify(animeData), 'EX', 3600);
    
    return animeData;
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : 'Failed to fetch anilist data: Unknown error'}`)
  }
}