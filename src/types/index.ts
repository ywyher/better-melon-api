import { t } from "elysia";

export const animeProvider = t.UnionEnum(['hianime'],{
    error: {
      success: false,
      message: `Invalid provider. Supported providers: hianime`
    }
})

export type AnimeProvider = typeof animeProvider.static

export interface ErrorResponse {
  success: false;
  message: string;
  status?: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;