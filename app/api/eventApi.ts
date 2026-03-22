import { EventModel, ServiceResult } from '../interfaces/models';
import { apiClient } from './client';

export const eventApi = {
  getAll: () =>
    apiClient.get<ServiceResult<EventModel[]>>('/event/GetAllEventsAsync'),

  getById: (id: number) =>
    apiClient.get<ServiceResult<EventModel>>(`/event/${id}`),

  getByCity: (city: string) =>
    apiClient.get<ServiceResult<EventModel[]>>('/event', { params: { city } }),

  getByCoords: (lat: number, lon: number) =>
    apiClient.get<ServiceResult<EventModel[]>>('/event', { params: { lat, lon } }),

  create: (event: Partial<EventModel>) =>
    apiClient.post<ServiceResult<EventModel>>('/event', event),

  update: (id: number, event: Partial<EventModel>) =>
    apiClient.put<ServiceResult<EventModel>>(`/event/${id}`, event),

  delete: (id: number) =>
    apiClient.delete<ServiceResult<boolean>>(`/event/${id}`),
};
