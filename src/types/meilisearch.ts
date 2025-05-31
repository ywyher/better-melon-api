import { t } from "elysia";
import { jmdictWord } from "./jmdict";

export const index = t.UnionEnum([
  "jmdict",
],{
  error: {
    success: false,
    message: `Invalid provider. Supported providers: hianime`
  }
})

export const meiliSearchResponse = t.Object({
  hits: t.Array(jmdictWord),
  query: t.String(),
  processingTimeMs: t.Number(),
  limit: t.Number(),
  offset: t.Number(),
  estimatedTotalHits: t.Number(),
})

export type Index = typeof index.static
export type MeiliSearchResponse = typeof meiliSearchResponse.static