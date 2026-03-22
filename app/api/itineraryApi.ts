import { ItineraryDetailModel, ItineraryPageDTO, ServiceResult } from '../interfaces/models';
import { apiClient } from './client';

export interface CreateItineraryRequest {
  id: number;
  name: string;
  description: string;
  idUser: number;
  dataStart: string;
  dataStop: string;
  itineraryDetails: Partial<ItineraryDetailModel>[];
}

export interface CreateDetailRequest {
  id: number;
  idItinerary: number;
  idObjective?: number | null;
  idEvent?: number | null;
  name: string;
  descriere?: string;
  visitOrder: number;
  date?: string;
  estimatedTime?: number;
}

export const itineraryApi = {
  getAll: () =>
    apiClient.get<ServiceResult<ItineraryPageDTO[]>>('/itinerary/GetItineraryAsync'),

  getMine: () =>
    apiClient.get<ServiceResult<ItineraryPageDTO[]>>('/itinerary/me'),

  getById: (id: number) =>
    apiClient.get<ServiceResult<ItineraryPageDTO>>(`/itinerary/${id}`),

  create: (data: Partial<CreateItineraryRequest>) =>
    apiClient.post<ServiceResult<any>>('/itinerary/AddItineraryAsync', data),

  update: (data: Partial<CreateItineraryRequest>) =>
    apiClient.put<ServiceResult<any>>('/itinerary/UpdateItineraryAsync', data),

  delete: (id: number) =>
    apiClient.delete<ServiceResult<boolean>>(`/itinerary/${id}`),

  addDetail: (detail: CreateDetailRequest) =>
    apiClient.post<ServiceResult<ItineraryDetailModel>>(
      '/itinerarydetail/AddItineraryDetailAsync',
      detail,
    ),

  updateDetail: (detail: CreateDetailRequest) =>
    apiClient.put<ServiceResult<ItineraryDetailModel>>(
      '/itinerarydetail/UpdateItineraryDetailAsync',
      detail,
    ),

  deleteDetail: (id: number) =>
    apiClient.delete<ServiceResult<boolean>>(`/itinerarydetail/${id}`),
};
