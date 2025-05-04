import Elysia, { t } from "elysia";
import { getSubtitleFiles } from "./services/subtitle";
import { getHianimeAnime } from "./services/hianime";
import { assertSuccess, createError, isErrorResponse } from "./lib/utils";
import { subtitleFile } from "./types/subtitle";
import { hianimeAnimeData, hianimeAnimeEpisodeStreamingLink } from "./types/hianime";
import { animeProvider } from "./types";

export const api = new Elysia({ prefix: '/api/v1' })
  .get(
  '/:anilistId/:episodeNumber/:provider',
  async ({ params: { anilistId, episodeNumber, provider } }) => {
      const fetchStart = performance.now()

      console.clear()
      let anime;
      
      switch(provider) {
        case 'hianime':
          anime = await getHianimeAnime(anilistId, episodeNumber);
          break;
        default:
          return createError(`Unsupported provider: ${provider}`)
      }
      assertSuccess(anime)

      const subtitleFiles = await getSubtitleFiles(anilistId, episodeNumber);
      assertSuccess(subtitleFiles)

      const fetchEnd = performance.now()
      console.log(`Fetched data in ${(fetchEnd - fetchStart).toFixed(2)}ms`);

      return {
        success: true,
        data: {
          provider,
          anime,
          subtitles: subtitleFiles,
        }
      };
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
          provider: animeProvider,
          anime: t.Object({
            details: t.Any(hianimeAnimeData),
            streamingLinks: hianimeAnimeEpisodeStreamingLink
          }),
          subtitles: t.Array(subtitleFile)
        })),
        message: t.Optional(t.String())
      })
    }
  )
  .get('/health', () => ({ status: 'ok' }))