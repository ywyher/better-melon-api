import Elysia, { t } from "elysia";
import { getSubtitleFiles } from "./services/subtitle";
import { getHianimeAnime } from "./services/hianime";
import { assertSuccess, createError, isErrorResponse } from "./lib/utils";
import { subtitleFile } from "./types/subtitle";
import { hianimeAnimeData, hianimeAnimeEpisodeStreamingLink, hianimeAnimeResponse, HianimeAnimeResponse } from "./types/hianime";
import { animeProvider } from "./types";
import { anilistAnimeData } from "./types/anilist";

export const api = new Elysia({ prefix: '/api' })
  .get(
  '/:anilistId/:episodeNumber/:provider',
  async ({ params: { anilistId, episodeNumber, provider } }) => {
      const fetchStart = performance.now()

      console.clear()

      try {
        const anime = await getHianimeAnime(anilistId, episodeNumber);

        const subtitleFiles = await getSubtitleFiles(anilistId, episodeNumber);
  
        const fetchEnd = performance.now()
        console.log(`Fetched data in ${(fetchEnd - fetchStart).toFixed(2)}ms`);
  
        return {
          success: true,
          data: {
            provider,
            details: anime.details,
            streamingLinks: anime.streamingLinks,
            subtitles: subtitleFiles,
          }
        };
      } catch (error) {
        return createError(`${error instanceof Error ? error.message : 'Failed to fetch data from hianime provider: Unknown error'}`);
      }
    }, 
    {
      params: t.Object({
        anilistId: t.String(),
        episodeNumber: t.String(),
        provider: animeProvider,
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          provider: t.Number(),
          details: anilistAnimeData,
          streamingLinks: hianimeAnimeEpisodeStreamingLink,
          subtitles: t.Array(subtitleFile)
        })),
        message: t.Optional(t.String())
      })
    }
  )
  .get('/health', () => ({ status: 'ok' }))