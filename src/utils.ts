import { animeProivders } from "./constants";
import { AnimeProvider, ErrorResponse } from "./types";

export const isValidProvider = (provider: string): provider is AnimeProvider => {
  return animeProivders.includes(provider as AnimeProvider);
};

export function isErrorResponse(obj: unknown): obj is ErrorResponse {
  return typeof obj === 'object' && obj !== null && 'success' in obj && (obj as ErrorResponse).success === false;
}

export function createError(message: string, status?: number): ErrorResponse {
  return {
    success: false,
    message,
    status
  };
}