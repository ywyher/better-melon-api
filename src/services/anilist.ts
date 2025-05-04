import { env } from "../lib/env";
import { ErrorResponse, SuccessResponse } from "../types";
import { AnilistAnimeData } from "../types/anilist"
import { assertSuccess, createError, makeRequest } from "../lib/utils";

export async function getAnilistAnime(anilistId: AnilistAnimeData['Media']['id']): Promise<AnilistAnimeData | ErrorResponse> {
  try {
    const { data: { data: anilistData } } = await makeRequest<SuccessResponse<AnilistAnimeData>>(
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
                format
                title {
                  english
                }
                episodes
                description
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
                genres
              } 
            }
          `,
        }
      }, 
    );
    assertSuccess(anilistData)
    
    return anilistData;
  } catch (error) {
    return createError(`${error instanceof Error ? error.message : 'Failed to fetch anilist data: Unknown error'}`)
  }
}