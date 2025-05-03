export type AnimeProvider = 'hianime' | 'animepahe' 

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