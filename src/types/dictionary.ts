import { t } from "elysia";
import { index } from "./meilisearch";
import { jmdictWord } from "./jmdict";
import { kanjidic2Character } from "./kanjidic2";
import { JMnedictWord } from "./jmnedict";

export const dictionarySearchResponse = t.Array(
  t.Object({
    index: index,
    entries: t.Array(t.Union([jmdictWord, kanjidic2Character, JMnedictWord]))
  })
);

export type DictionarySearchResponse = typeof dictionarySearchResponse.static