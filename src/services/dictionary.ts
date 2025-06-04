import { isKana, isKanji } from "wanakana";
import { meili } from "../lib/meilisearch";
import clipboard from 'clipboardy'
import { Index } from "../types/meilisearch";
import { MultiSearchResult, RecordAny } from "meilisearch";
import { DictionarySearchResponse } from "../types/dictionary";

type Query = {
  indexUid: Index;
  q: string;
  limit: number;
  filter?: string[]
  sort?: string[]
}

function getJMdictSearchQueries(query: string): Query[] {
  let jmdictQueries: Query[] = [];
  const kanaOnly = isKana(query)
  
  if (kanaOnly) {
    // Strategy: Multiple queries with different priorities
    jmdictQueries = [
      // 1. Kana-only entries (no kanji) - highest priority
      {
        indexUid: 'jmdict',
        q: `"${query}"`,
        limit: 3,
        filter: [
          `kana.text = "${query}"`,
          'kanji IS EMPTY'
        ],
        sort: ['kana.text:asc']
      },
      // 2. Entries with kanji that have this kana reading
      {
        indexUid: 'jmdict',
        q: `"${query}"`,
        limit: 3,
        filter: [`kana.text = ${query}`],
      },
      // 3. Fallback: Fuzzy Match
      {
        indexUid: 'jmdict',
        q: `${query}`,
        limit: 2,
        sort: [ 'isKana:desc' ]
      }
    ];
  } else {
    // Kanji/mixed queries
    jmdictQueries = [
      // Exact match
      {
        indexUid: 'jmdict',
        q: `"${query}"`,
        limit: 5,
        sort: ['kanji.text:asc']
      },
      // Fuzzy match
      {
        indexUid: 'jmdict',
        q: `${query}`,
        limit: 2,
      }
    ];
  }

  return jmdictQueries;
}

function getKanjidic2Queries(query: string): Query[] {
  let kanjiQueries: Query[] = [];
  const letters: string[] = query.split('');
  letters.map(letter => {
    if(isKanji(letter)) kanjiQueries.push({
      indexUid: 'kanjidic2',
      q: `"${letter}"`,
      limit: 5,
      filter: [
        `literal = ${letter}`
      ]
    })
  })

  return kanjiQueries
}

function mergeResultsByIndex(results: MultiSearchResult<RecordAny>[]): MultiSearchResult<RecordAny>[] {
  const merged = new Map();
  
  results.forEach(result => {
    const key = result.indexUid;
    
    if (merged.has(key)) {
      // Merge hits and update metadata
      const existing = merged.get(key);
      
      // Deduplicate hits based on a unique identifier
      const existingHitIds = new Set(existing.hits.map((hit: any) => hit.id || JSON.stringify(hit)));
      const newHits = result.hits.filter((hit: any) => 
        !existingHitIds.has(hit.id || JSON.stringify(hit))
      );
      
      existing.hits = [...existing.hits, ...newHits];
      existing.estimatedTotalHits = Math.max(existing.estimatedTotalHits, result.estimatedTotalHits || 0);
      existing.processingTimeMs += result.processingTimeMs;
      
      // Combine queries if different
      if (existing.query !== result.query) {
        existing.query = `${existing.query}, ${result.query}`;
      }
    } else {
      // First result for this index
      merged.set(key, { ...result });
    }
  });
  
  return Array.from(merged.values());
}

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

    const fullOutput = JSON.stringify(mergedResults, null, 2);
    clipboard.writeSync(fullOutput);

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