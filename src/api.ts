import Elysia, { t } from "elysia";
import { getSubtitleFiles } from "./services/subtitle";
import { getHianimeAnime } from "./services/hianime";
import { createError } from "./utils/utils";
import { subtitleFile } from "./types/subtitle";
import { hianimeAnimeEpisodeStreamingLink } from "./types/hianime";
import { animeProvider } from "./types";
import { anilistAnimeData } from "./types/anilist";
import { searchJMdict } from "./services/jmdict";
import { jmdictSearchResponse } from "./types/jmdict";
import { searchDictionary } from "./services/dictionary";
import { dictionarySearchResponse } from "./types/dictionary";

export const api = new Elysia({ prefix: '/api' })
  .get('/dictionary/search/:query', 
    async ({ params: { query } }) => {
      try {
        const decodedQuery = decodeURIComponent(query)
        const  result = await searchDictionary(decodedQuery)
        return {
          success: true,
          data: result
        }
      } catch (error) {
        return createError(`${error instanceof Error ? error.message : 'Failed to fetch data from hianime provider: Unknown error'}`);
      }
  }, {
    params: t.Object({
      query: t.String()
    }),
    response: t.Object({
      success: t.Boolean(),
      data: t.Optional(dictionarySearchResponse),
      message: t.Optional(t.String())
    })
  })
  .get('/indexes/:index/search/:query', 
    async ({ params: { query } }) => {
      try {
        const decodedQuery = decodeURIComponent(query)
        const { entries } = await searchJMdict(decodedQuery)
        return {
          success: true,
          data: {
            entries
          },
        }
      } catch (error) {
        return createError(`${error instanceof Error ? error.message : 'Failed to fetch data from hianime provider: Unknown error'}`);
      }
  }, {
    params: t.Object({
      index: t.Literal("jmdict"),
      query: t.String()
    }),
    response: t.Object({
      success: t.Boolean(),
      data: t.Optional(jmdictSearchResponse),
      message: t.Optional(t.String())
    })
  })
  .get(
  '/:anilistId/:episodeNumber/:provider',
  async ({ params: { anilistId, episodeNumber, provider } }) => {
      const fetchStart = performance.now()

      console.log('*-----------------------------------------------------------------------------------*')

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
          provider: animeProvider,
          details: anilistAnimeData,
          streamingLinks: hianimeAnimeEpisodeStreamingLink,
          subtitles: t.Array(subtitleFile)
        })),
        message: t.Optional(t.String())
      })
  })
  .get('/health', () => ({ status: 'ok' }))