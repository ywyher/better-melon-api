import { meili } from "../lib/meilisearch";
import { isKana } from 'wanakana';
import { JMdictSearchResponse } from "../types/jmdict";

export async function searchJMdict(query: string): Promise<JMdictSearchResponse> {
  try {
    const kanaOnly = isKana(query)
    const index = await meili.getIndex('jmdict');
    let result;
    let isFuzzy = false;

    if(kanaOnly) {
      result = await index.search(`"${query}"`, {
        filter: [
          kanaOnly ? `kanji IS EMPTY` : '',
          kanaOnly ? `kana.text = ${query}` : ''
        ],
        sort: [
          kanaOnly ? 'kana.text:asc' : 'kanji.text:asc'
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
      console.log(`Fallback: Exact match`)
      result = await index.search(`"${query}"`, {
        sort: [
          kanaOnly ? 'kana.text:asc' : 'kanji.text:asc'
        ]
      });
    }

    // Fallback 2: fuzzy search (this will catch 異なり -> 異なる)
    if(!result.hits.length) {
      console.log(`Fallback: Fuzzy match`)
      result = await index.search(query, {
        sort: [
          kanaOnly ? 'kana.text:asc' : 'kanji.text:asc'
        ]
      }); // No quotes = fuzzy matching
      isFuzzy = true
    }

    if(!result.hits.length) throw new Error('result not found')

    return {
      entries: result.hits,
      isFuzzy
    } as JMdictSearchResponse;
  } catch (error) {
    console.error('Error in searchJMdict:', error);
    throw new Error(`${error instanceof Error ? error.message : 'Failed to search jmdict: Unknown error'}`);
  }
}