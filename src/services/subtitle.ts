import { env } from "../env";
import { ErrorResponse } from "../types";
import { SubtitleEntry, SubtitleFile } from "../types/subtitle";
import { isErrorResponse } from "../utils";

export async function getSubtitleEntries(anilistId: string): Promise<SubtitleEntry[] | ErrorResponse> {
  try {
    const entries = await fetch(`https://jimaku.cc/api/entries/search?anilist_id=${anilistId}`, {
      headers: { Authorization: `${env.JIMAKU_KEY}` },
    });
    
    if (!entries.ok) {
      throw new Error(`Failed to fetch subtitle entries: ${entries.status} ${entries.statusText}`);
    }
    
    return await entries.json() as SubtitleEntry[];
  } catch (error) {
    return {
      success: false,
      message: `Failed to fetch subtitle entries: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function getSubtitleFiles(anilistId: string, episodeNumber: string): Promise<SubtitleFile[] | ErrorResponse> {
  try {
    const entries = await getSubtitleEntries(anilistId);
    
    if (isErrorResponse(entries)) {
      return entries;
    }
    
    if (entries.length === 0) {
      return {
        success: false,
        message: `No subtitle entries found for Anilist ID: ${anilistId}`
      };
    }
    
    const files = await fetch(`https://jimaku.cc/api/entries/${entries[0].id}/files?episode=${episodeNumber}`, {
      headers: { Authorization: `${process.env.JIMAKU_KEY}` },
    });
    
    if (!files.ok) {
      throw new Error(`Failed to fetch subtitle files: ${files.status} ${files.statusText}`);
    }
    
    return await files.json() as SubtitleFile[];
  } catch (error) {
    return {
      success: false,
      message: `Failed to fetch subtitle files: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}