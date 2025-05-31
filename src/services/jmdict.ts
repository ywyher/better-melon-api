import { meili } from "../lib/meilisearch";
import { MeiliSearchResponse } from "../types/meilisearch";
import clipboard from 'clipboardy';

export default async function searchJmdict(query: string): Promise<MeiliSearchResponse> {
  try {
    const index = await meili.getIndex('jmdict');
    const result: MeiliSearchResponse = await index.search(query);

    const fullOutput = JSON.stringify(result, null, 2);
    clipboard.writeSync(fullOutput); // Copy to clipboard

    return result;
  } catch (error) {
    console.error('Error in searchJmdict:', error);
    throw new Error(`${error instanceof Error ? error.message : 'Failed to search jmdict: Unknown error'}`);
  }
}