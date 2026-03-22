export interface ObjectiveType {
  id: number;
  name: string;
  description: string;
}

export interface UserModel {
  id: number;
  userName: string;
  email: string | null;
  phone: string | null;
  role: 0 | 1;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewModel {
  id: number;
  idUser: number;
  user: UserModel | null;
  idObjective: number;
  raiting: number;
  comment: string | null;
  datePosted: string;
}

export interface ObjectiveModel {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  type: number;
  objectiveType: ObjectiveType | null;
  website: string | null;
  interval: string | null;
  pret: string | null;
  duration: number | null;
  medieReview: number;
  distance: number;
  formattedDistance: string;
  images: string[];
  reviews: ReviewModel[];
}

export interface EventModel {
  id: number;
  name: string;
  description: string;
  country: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  endDate: string;
  idObjective: number | null;
  objective: ObjectiveModel | null;
  images: string[];
}

export interface ExperienceModel {
  id: number;
  name: string | null;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  locationName: string | null;
  rating: number | null;
  isPublic: boolean;
  images: string[];
}

export interface ItineraryDetailModel {
  id: number;
  idItinerary: number | null;
  idObjective: number | null;
  objective: ObjectiveModel | null;
  idEvent: number | null;
  event: EventModel | null;
  name: string;
  descriere: string | null;
  visitOrder: number;
  date: string | null;
  estimatedTime: number | null;
  images: string[];
}

export interface ItineraryPageDTO {
  id: number;
  name: string;
  description: string;
  idUser: number | null;
  dataStart: string | null;
  dataStop: string | null;
  itineraryDetails: ItineraryDetailModel[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ServiceResult<T> {
  isSuccessful: boolean;
  result: T;
  validationMessage: string | null;
}
