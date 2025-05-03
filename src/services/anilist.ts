import { env } from "../env";
import { ErrorResponse, SuccessResponse } from "../types";
import { AnilistAnimeData } from "../types/anilist"

export async function getAnilistAnime(anilistId: AnilistAnimeData['Media']['id']): Promise<AnilistAnimeData | ErrorResponse> {
  try {
    const anilistData = await fetch(env.ANILIST_URL || "", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
        `
      })
    })
  
    if(!anilistData.ok) throw new Error(`Error while fetching anilist data: ${anilistData.status} ${anilistData.statusText}`)
    const { data } = await anilistData.json() as SuccessResponse<AnilistAnimeData>

    return data;
  } catch (error) {
    return {
      success: false,
      message: `Failed to fetch anilist data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}