import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
 
export const env = createEnv({
  server: {
    PORT: z.string(),
    ANILIST_URL: z.string().url(),
    ANIWATCH_URL: z.string().url(),
    JIMAKU_KEY: z.string().min(1),
    JIMAKU_URL: z.string().url()
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});