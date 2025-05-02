import Elysia, { t } from "elysia";
import { AnilistAnimeData, AnilistAnimeFormat, anilistAnimeFormat, AnilistAnimeStatus } from "./types/anilist";
import { HianimeAnimeStatus, hianimeAnimeStatus, HianimeAnimeType, hianimeAnimeType } from "./types/hianime";

export const animeProivders = ['hianime', 'animepahe']

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
    return {
      success: false,
      message: `Invalid type: ${format}. Valid HiAnime types are: ${Object.keys(hianimeAnimeType.enum).join(', ')}`
    };
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
    return {
      success: false,
      message: `Invalid status: ${status}. Valid HiAnime statuss are: ${Object.keys(hianimeAnimeStatus.enum).join(', ')}`
    };
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
   
export const api = new Elysia({ prefix: '/api/v1' })
  .get(
    '/:anilistId/:provider',
    async ({ params: { anilistId, provider } }) => {
      const anilistDataRaw = await fetch(process.env.ANILIST_URL || "", {
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

      const { data: anilistData }: { data: AnilistAnimeData } = await anilistDataRaw.json();

      const { endDate, genres, q, season, startDate, status, type } = mapAnilistToHiAnime(anilistData)

      const hianimeDataRaw = await fetch(`${process.env.ANIWATCH_URL}/search?q=${q}&genres=${genres}&type=${type}&status=${status}&startDate=${startDate}&endDate=${endDate}&season=${season}&sort=score&language=sub&score=good`)
      const hianimeData = await hianimeDataRaw.json()

      return {
        success: true,
        data: hianimeData
      };
    }, {
      params: t.Object({
        anilistId: t.String(),
        provider: t.UnionEnum(['hianime', 'animepahe'], {
          error: {
            success: false,
            message: `Invalid proivder Supported proivders: ${animeProivders.join(',')}`
          }
        })
      }),
  })
  .get('testing', async () => {
    const resp = await fetch(
      `${process.env.ANIWATCH_URL}/search?q=girl&type=movie`
    );

    return { 
      success: true,
      data: await resp.json()
    }
  })