import { meili } from "../lib/meilisearch";
import { MeiliSearchResponse } from "../types/meilisearch";
import { isKana } from 'wanakana';

export default async function searchJMdict(query: string): Promise<MeiliSearchResponse> {
  try {
    const kanaOnly = isKana(query)
    const index = await meili.getIndex('jmdict');
    let result;

    if(kanaOnly) {
      result = await index.search(`"${query}"`, {
        filter: [
          kanaOnly ? `kanji IS EMPTY` : '',
          kanaOnly ? `kana.text = ${query}` : ''
        ]
      });

    }else {
      result = await index.search(`"${query}"`, {
        filter: [
          `kanji.text = ${query}`
        ],
      });
    }

    // Fallback 1: exact match without filters
    if(!result.hits.length) {
      result = await index.search(`"${query}"`);
    }

    // Fallback 2: fuzzy search (this will catch 異なり -> 異なる)
    if(!result.hits.length) {
      result = await index.search(query); // No quotes = fuzzy matching
    }

    if(!result.hits.length) throw new Error('result not found')

    return result.hits as MeiliSearchResponse;
  } catch (error) {
    console.error('Error in searchJMdict:', error);
    throw new Error(`${error instanceof Error ? error.message : 'Failed to search jmdict: Unknown error'}`);
  }
}