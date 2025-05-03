import Elysia, { t } from "elysia";
import { getSubtitleFiles } from "./services/subtitle";
import { getHianimeAnime } from "./services/hianime";
import { isErrorResponse } from "./utils";
import { animeProivders } from "./constants";
import { env } from "./env";


export const api = new Elysia({ prefix: '/api/v1' })
  .get(
    '/:anilistId/:episodeNumber/:provider',
    async ({ params: { anilistId, episodeNumber, provider } }) => {
      let anime;
      
      switch(provider) {
        case 'hianime':
          anime = await getHianimeAnime(anilistId, episodeNumber);
          break;
        case 'animepahe':
          return {
            success: false,
            message: "Animepahe provider is not yet implemented"
          };
        default:
          return {
            success: false,
            message: `Unsupported provider: ${provider}`
          };
      }

      const subtitleFiles = await getSubtitleFiles(anilistId, episodeNumber);

      if (isErrorResponse(anime)) return anime;
      if (isErrorResponse(subtitleFiles)) return subtitleFiles;

      return {
        success: true,
        data: {
          anime,
          subtitleFiles,
        }
      };
    }, 
    {
      params: t.Object({
        anilistId: t.String(),
        episodeNumber: t.String(),
        provider: t.UnionEnum(animeProivders, {
          error: {
            success: false,
            message: `Invalid provider. Supported providers: ${animeProivders.join(', ')}`
          }
        })
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          anime: t.Any(),
          subtitleFiles: t.Any()
        })),
        message: t.Optional(t.String())
      })
    }
  )
  .get('/health', () => ({ status: 'ok' }))
  .listen(env.PORT)

console.log(`🦊 Elysia is running at http://localhost:3000`)
