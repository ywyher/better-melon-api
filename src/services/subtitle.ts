import { env } from "../lib/env";
import { SubtitleEntry, SubtitleFile } from "../types/subtitle";
import { makeRequest } from "../utils/utils";

export async function getSubtitleEntries(anilistId: string): Promise<SubtitleEntry[]> {
  try {
    const { data: entries } = await makeRequest<SubtitleEntry[]>(
      `${env.JIMAKU_URL}/api/entries/search?anilist_id=${anilistId}`, {
      headers: { 
        Authorization: env.JIMAKU_KEY
      },
      benchmark: true,
      name: 'subitlte-entries',
    });

    return entries;
  } catch (error) {
    throw new Error(` ${error instanceof Error ? error.message : 'Failed to fetch subtitle entries: Unknown error'}`)
  }
}

export async function getSubtitleFiles(anilistId: string, episodeNumber: string): Promise<SubtitleFile[]> {
  try {
    const entries = await getSubtitleEntries(anilistId);
    
    const { data: files } = await makeRequest<SubtitleFile[]>(
      `${env.JIMAKU_URL}/api/entries/${entries[0].id}/files?episode=${episodeNumber}`, {
      headers: { 
        Authorization: env.JIMAKU_KEY
      },
      benchmark: true,
      name: 'subtitle-files',
    });

    return files;
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : 'Failed to fetch subtitle files: Unknown error'}`)
  }
}