import { ObjectiveModel, ObjectiveType, PagedResult, ServiceResult } from '../interfaces/models';
import { apiClient } from './client';

export interface ObjectiveFilter {
  latitude?: number;
  longitude?: number;
  maxDistance?: number;
  name?: string;
  typeId?: number;
  minRating?: number;
}

export const objectiveApi = {
  getAll: (search?: string, page = 1, pageSize = 20) =>
    apiClient.get<ServiceResult<PagedResult<ObjectiveModel>>>('/objectives/GetObjectivesAsync', {
      params: { search, page, pageSize },
    }),

  getLocal: (filter: ObjectiveFilter) =>
    apiClient.post<ServiceResult<ObjectiveModel[]>>('/objectives/GetLocalObjectives', filter),

  getById: (id: number) =>
    apiClient.get<ServiceResult<ObjectiveModel>>(`/objectives/${id}`),

  getTypes: () => apiClient.get<ObjectiveType[]>('/objectivetype'),
};
