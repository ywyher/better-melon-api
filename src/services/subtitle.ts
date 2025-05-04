import { env } from "../lib/env";
import { ErrorResponse } from "../types";
import { SubtitleEntry, SubtitleFile } from "../types/subtitle";
import { assertSuccess, createError, isErrorResponse, makeRequest } from "../lib/utils";

export async function getSubtitleEntries(anilistId: string): Promise<SubtitleEntry[] | ErrorResponse> {
  try {
    const { data: entries } = await makeRequest<SubtitleEntry[]>(
      `${env.JIMAKU_URL}/api/entries/search?anilist_id=${anilistId}`, {
      headers: { 
        Authorization: env.JIMAKU_KEY
      },
      benchmark: true,
      name: 'subitlte-entries',
    });
    assertSuccess(entries)

    return entries;
  } catch (error) {
    return createError(` ${error instanceof Error ? error.message : 'Failed to fetch subtitle entries: Unknown error'}`)
  }
}

export async function getSubtitleFiles(anilistId: string, episodeNumber: string): Promise<SubtitleFile[] | ErrorResponse> {
  try {
    const entries = await getSubtitleEntries(anilistId);
    assertSuccess(entries)
    
    const { data: files } = await makeRequest<SubtitleFile[]>(
      `${env.JIMAKU_URL}/api/entries/${entries[0].id}/files?episode=${episodeNumber}`, {
      headers: { 
        Authorization: env.JIMAKU_KEY
      },
      benchmark: true,
      name: 'subtitle-files',
    });
    assertSuccess(files)

    return files;
  } catch (error) {
    return createError(`${error instanceof Error ? error.message : 'Failed to fetch subtitle files: Unknown error'}`)
  }
}