import { meili } from "../lib/meilisearch";
import { Index } from "../types/meilisearch";
import { DictionarySearchResponse } from "../types/dictionary";
import { getKanjidic2Queries } from "../utils/kanjidic2";
import { getJMdictSearchQueries } from "../utils/jmdict";
import { mergeResultsByIndex } from "../utils/dictionary";

export async function searchDictionary(query: string): Promise<DictionarySearchResponse> {
  const jmdictQueries = getJMdictSearchQueries(query)
  const kanjidic2Queries = getKanjidic2Queries(query)

  try {
    const { results } = await meili.multiSearch({ 
      queries: [
        ...jmdictQueries,
        {
          indexUid: 'jmnedict',
          q: `${query}`,
          limit: 5,
        },
        ...kanjidic2Queries
      ]
    });

    // Merge results by indexUid
    const mergedResults = mergeResultsByIndex(results);

    // const fullOutput = JSON.stringify(mergedResults, null, 2);
    // clipboard.writeSync(fullOutput);

    return mergedResults.map(result => {
      return {
        index: result.indexUid as Index,
        entries: result.hits as any
      }
    });
  } catch (error) {
    console.error('Error in searchDictionary:', error);
    throw new Error(`${error instanceof Error ? error.message : 'Failed to search jmdict: Unknown error'}`);
  }
}