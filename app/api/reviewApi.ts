import { ReviewModel } from '../interfaces/models';
import { apiClient } from './client';

export interface CreateReviewRequest {
  idUser: number;
  idObjective: number;
  raiting: number;
  comment?: string;
  datePosted: string;
}

export const reviewApi = {
  getByObjective: (objectiveId: number) =>
    apiClient.get<ReviewModel[]>(`/review/objective/${objectiveId}`),

  getById: (id: number) => apiClient.get<ReviewModel>(`/review/${id}`),

  create: (review: CreateReviewRequest) => apiClient.post('/review', review),

  delete: (id: number) => apiClient.delete(`/review/${id}`),
};
