import Elysia from "elysia";
import { env } from "./lib/env";
import { api } from "./api";
import { animeProviders } from "./lib/constants";
import { cors } from '@elysiajs/cors';

export const server = new Elysia()
  .use(cors())
  .use(api)
  .get('/', () => {
    return {
      about: "This API provide the needed data like M3U8 links and japanese subtitle files for better-melon",
      status: '200',
      providers: animeProviders[0],
      routes: [
        '/api/v1/:anilistId/:episodeNumber/:provider',
        '/api/v1/health'
      ]
    }
  })
  .listen(env.PORT)