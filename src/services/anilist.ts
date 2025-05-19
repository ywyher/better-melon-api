import { AnilistAnimeData, AnilistAnimeResponse } from "../types/anilist"
import { makeRequest } from "../lib/utils";
import { env } from "../lib/env";

export async function getAnilistAnime(anilistId: AnilistAnimeData['id']): Promise<AnilistAnimeData> {
  try {
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

    return anilistAnimeData.Media;
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : 'Failed to fetch anilist data: Unknown error'}`)
  }
}