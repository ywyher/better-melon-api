import { MultiSearchResult, RecordAny } from "meilisearch";

export function mergeResultsByIndex(results: MultiSearchResult<RecordAny>[]): MultiSearchResult<RecordAny>[] {
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