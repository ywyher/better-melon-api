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
      
      if(!result.hits.length) {
        result = await index.search(`"${query}"`);
      }
    }else {
      result = await index.search(`"${query}"`, {
        filter: [
          `kanji.text = ${query}`
        ],
      });
      
      if(!result.hits.length) {
        result = await index.search(`"${query}"`);
      }
    }

    if(!result) throw new Error('result not found')

    return result.hits as MeiliSearchResponse;
  } catch (error) {
    console.error('Error in searchJMdict:', error);
    throw new Error(`${error instanceof Error ? error.message : 'Failed to search jmdict: Unknown error'}`);
  }
}