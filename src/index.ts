import Elysia from "elysia";
import { env } from "./lib/env";
import { api } from "./api";
import { animeProviders, indexes } from "./lib/constants";
import { cors } from '@elysiajs/cors';

export const server = new Elysia()
  .use(cors())
  // .onError(({ code }) => {
  //   if(code == 'NOT_FOUND') {
  //     return createError(code)
  //   }else if (code == 'VALIDATION') {
  //     return createError(code)
  //   }
  // })
  .use(api)
  .get('/', () => {
    return {
      about: "This API provide the needed data like M3U8 links, japanese subtitle files and dictionary data for better-melon",
      status: '200',
      providers: animeProviders[0],
      indexes: indexes[0],
      routes: [
        '/api/indexes/:index/search/:query',
        '/api/:anilistId/:episodeNumber/:provider',
        '/api/health'
      ]
    }
  })
  .listen(env.PORT)