// Service API pour les statistiques
export const statisticsAPI = {
  // Récupérer les statistiques d'un événement (par id ou slug)
  getByEvent: async (eventId: string | number) => {
    const response = await api.get(`/stats`, {
      params: { event_id: eventId },
    });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les statistiques de l'événement",
      );
    }
  },
  // Récupérer les statistiques globales (sans event_id)
  getGlobal: async () => {
    const response = await api.get(`/stats`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les statistiques globales",
      );
    }
  },
};
// Configuration API et services
import axios, { AxiosError } from "axios";
import { env } from "../config/env";
import type {
  User,
  LoginCredentials,
  ApiResponse,
  UserWithRoles,
  CreateUserData,
  UpdateUserData,
  Organization,
  CreateOrganizationData,
  UpdateOrganizationData,
  Event,
  EventsListParams,
  CreateEventData,
  UpdateEventData,
  Activity,
  CreateActivityData,
  UpdateActivityData,
  Ticket,
  CreateTicketData,
  UpdateTicketData,
  Product,
  CreateProductData,
  UpdateProductData,
  Order,
  Parking,
  CreateParkingData,
  ParkingType,
  ParkingRule,
  CreateParkingRuleData,
  UpdateParkingRuleData,
  PhysicalPoint,
  CreatePhysicalPointData,
  UpdatePhysicalPointData,
  EventRequest,
  PaginatedResponse,
  Image,
  // Product-Ticket attribution rules types
  ProductTicketAttributionRule,
  CreateAttributionRuleData,
  UpdateAttributionRuleData,
  // Parking-Ticket rules types
  ParkingTicketRule,
  CreateParkingTicketRuleData,
  UpdateParkingTicketRuleData,
} from "../lib/types";
import type {
  DeliveryPoint,
  DeliveryPointFormData,
} from "../pages/event-management/delivery-points/catalogTypes";

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL n'est pas définie dans les variables d'environnement. " +
      "Veuillez créer un fichier .env à la racine du projet avec VITE_API_BASE_URL=http://localhost:8000/api",
  );
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tyva_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const readOnly = env.ORGA_READ_ONLY;
  const method = (config.method || "get").toLowerCase();
  const url = String(config.url || "");
  const isWriteMethod = ["post", "put", "patch", "delete"].includes(method);
  const isAuthEndpoint = url.includes("/login") || url.includes("/logout") || url.includes("/me");

  if (readOnly && isWriteMethod && !isAuthEndpoint) {
    return Promise.reject(
      new Error("Mode lecture seule : action d'écriture bloquée.")
    );
  }

  return config;
});

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne rediriger automatiquement que si on a un token (utilisateur connecté)
    // et si ce n'est PAS une tentative de connexion (/login)
    if (
      error.response?.status === 401 &&
      localStorage.getItem("tyva_token") &&
      !error.config?.url?.includes("/login")
    ) {
      localStorage.removeItem("tyva_token");
      localStorage.removeItem("tyva_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Fonction utilitaire pour ajouter les données au FormData
const addToFormData = (
  formData: FormData,
  data: CreateEventData | UpdateEventData,
) => {
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (key === "address" && typeof value === "object") {
        // Gérer l'adresse en ajoutant chaque champ séparément
        const address = value as Record<string, unknown>;
        if (address.name)
          formData.append("address[name]", String(address.name));
        if (address.description)
          formData.append("address[description]", String(address.description));
        if (address.city)
          formData.append("address[city]", String(address.city));
        if (address.country)
          formData.append("address[country]", String(address.country));
        if (address.latitude)
          formData.append("address[latitude]", String(address.latitude));
        if (address.longitude)
          formData.append("address[longitude]", String(address.longitude));
        if (address.maps_link)
          formData.append("address[maps_link]", String(address.maps_link));
      } else {
        formData.append(key, String(value));
      }
    }
  });
};

// Services API
export const authAPI = {
  login: async (
    credentials: LoginCredentials,
  ): Promise<{ user: User; token: string }> => {
    try {
      const response = await api.post<
        ApiResponse<{ user: User; token: string }>
      >("/login", credentials);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: unknown) {
      // Log pour debug (à retirer en production)
      if (import.meta.env.DEV) {
        console.log(
          "Erreur de connexion:",
          (error as AxiosError)?.response?.data,
        );
      }

      // Extraire le message d'erreur de la réponse Laravel
      const axiosError = error as AxiosError;
      if (
        axiosError?.response?.data &&
        typeof axiosError.response.data === "object" &&
        "message" in axiosError.response.data
      ) {
        throw new Error(
          (axiosError.response.data as { message: string }).message,
        );
      } else if (
        axiosError?.response?.data &&
        typeof axiosError.response.data === "object" &&
        "success" in axiosError.response.data &&
        (axiosError.response.data as { success: boolean }).success === false
      ) {
        const data = axiosError.response.data as { message?: string };
        throw new Error(data.message || "Erreur de connexion");
      } else {
        throw new Error((error as Error)?.message || "Erreur de connexion");
      }
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/logout");
    } catch (error) {
      // Ignorer les erreurs de déconnexion côté serveur
      console.warn("Erreur lors de la déconnexion:", error);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<{ user: User }>>("/me");

    if (response.data.success) {
      return response.data.data.user;
    } else {
      throw new Error(response.data.message);
    }
  },
};

// Services API pour les utilisateurs
export const usersAPI = {
  // Récupérer la liste des utilisateurs
  getAll: async (params?: {
    organizer_id?: number;
  }): Promise<UserWithRoles[]> => {
    const response = await api.get<ApiResponse<UserWithRoles[]>>("/users", {
      params,
    });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer la liste des utilisateurs",
      );
    }
  },

  // Récupérer un utilisateur par ID
  getById: async (id: number): Promise<UserWithRoles> => {
    const response = await api.get<ApiResponse<UserWithRoles>>(`/users/${id}`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les détails de l'utilisateur",
      );
    }
  },

  // Créer un nouvel utilisateur
  create: async (userData: CreateUserData): Promise<UserWithRoles> => {
    const response = await api.post<ApiResponse<{ user: UserWithRoles }>>(
      "/users",
      userData,
    );
    if (response.data.success) {
      return response.data.data.user;
    } else {
      throw new Error(
        response.data.message || "Impossible de créer l'utilisateur",
      );
    }
  },

  // Mettre à jour un utilisateur
  update: async (
    id: number,
    userData: UpdateUserData,
  ): Promise<UserWithRoles> => {
    const response = await api.put<ApiResponse<{ user: UserWithRoles }>>(
      `/users/${id}`,
      userData,
    );
    if (response.data.success) {
      return response.data.data.user;
    } else {
      throw new Error(
        response.data.message || "Impossible de mettre à jour l'utilisateur",
      );
    }
  },

  // Supprimer un utilisateur
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/users/${id}`);
    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer l'utilisateur",
      );
    }
  },
};

// Services API pour les organisations
export const organizationsAPI = {
  // Récupérer la liste des organisations
  getAll: async (): Promise<Organization[]> => {
    const response =
      await api.get<ApiResponse<Organization[]>>("/organizations");
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer la liste des organisations",
      );
    }
  },

  // Récupérer une organisation par ID
  getById: async (id: number): Promise<Organization> => {
    const response = await api.get<ApiResponse<Organization>>(
      `/organizations/${id}`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les détails de l'organisation",
      );
    }
  },

  // Créer une nouvelle organisation
  create: async (
    organizationData: CreateOrganizationData,
  ): Promise<Organization> => {
    const response = await api.post<
      ApiResponse<{ organization: Organization }>
    >("/organizations", organizationData);
    if (response.data.success) {
      return response.data.data.organization;
    } else {
      throw new Error(
        response.data.message || "Impossible de créer l'organisation",
      );
    }
  },

  // Mettre à jour une organisation
  update: async (
    id: number,
    organizationData: UpdateOrganizationData,
  ): Promise<Organization> => {
    const response = await api.put<ApiResponse<{ organization: Organization }>>(
      `/organizations/${id}`,
      organizationData,
    );
    if (response.data.success) {
      return response.data.data.organization;
    } else {
      throw new Error(
        response.data.message || "Impossible de mettre à jour l'organisation",
      );
    }
  },

  // Supprimer une organisation
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(
      `/organizations/${id}`,
    );
    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer l'organisation",
      );
    }
  },
};

/** Réponse API pour un point de livraison (champ `price`, statut inactive) */
type DeliveryPointApiRow = {
  id: number;
  country: string;
  city: string;
  zone: string;
  price: string | number;
  status: string;
  created_at: string;
  updated_at: string;
  physical_point_id?: number | null;
  physical_point?: { id: number; name: string } | null;
};

function deliveryPointFromApi(row: DeliveryPointApiRow): DeliveryPoint {
  return {
    id: row.id,
    country: row.country,
    city: row.city,
    zone: row.zone,
    delivery_price: Number(row.price),
    status: row.status === "inactive" ? "disabled" : "active",
    created_at: row.created_at,
    updated_at: row.updated_at,
    physical_point_id: row.physical_point_id ?? row.physical_point?.id ?? null,
    physical_point_name: row.physical_point?.name ?? null,
  };
}

function deliveryPointFormToCreateBody(
  data: DeliveryPointFormData,
  organizerId: number | null,
): Record<string, unknown> {
  return {
    organizer_id: organizerId,
    country: data.country,
    city: data.city,
    zone: data.zone,
    price: data.delivery_price,
    status: data.status === "disabled" ? "inactive" : "active",
  };
}

function deliveryPointFormToUpdateBody(
  data: DeliveryPointFormData,
): Record<string, unknown> {
  return {
    country: data.country,
    city: data.city,
    zone: data.zone,
    price: data.delivery_price,
    status: data.status === "disabled" ? "inactive" : "active",
  };
}

// Services API pour les événements
export const eventsAPI = {
  /**
   * Liste backoffice des événements accessibles au compte connecté.
   * Appelle `GET /events` (tyva-api : EventController::index) — filtrage par organisateur côté serveur.
   */
  getAll: async (params?: EventsListParams): Promise<Event[]> => {
    const query =
      params &&
      Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== null && v !== "",
        ),
      );
    const response = await api.get<ApiResponse<Event[]>>("/events", {
      params: query && Object.keys(query).length > 0 ? query : undefined,
    });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer la liste des événements",
      );
    }
  },

  getById: async (identifier: string | number): Promise<Event> => {
    const response = await api.get<ApiResponse<Event>>(`/events/${identifier}`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les détails de l'événement",
      );
    }
  },

  create: async (
    eventData: CreateEventData,
    mainImage?: File,
  ): Promise<Event> => {
    const formData = new FormData();

    // Ajouter les données de l'événement
    addToFormData(formData, eventData);

    // Ajouter l'image si fournie
    if (mainImage) {
      formData.append("main_image", mainImage);
    }

    const response = await api.post<ApiResponse<{ event: Event }>>(
      "/events",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (response.data.success) {
      return response.data.data.event;
    } else {
      throw new Error(
        response.data.message || "Impossible de créer l'événement",
      );
    }
  },

  update: async (
    identifier: string | number,
    eventData: UpdateEventData,
    mainImage?: File,
  ): Promise<Event> => {
    // Test : envoyer en JSON si pas d'image
    if (!mainImage) {
      console.log("API - Test JSON (sans image):", eventData);
      const response = await api.put<ApiResponse<{ event: Event }>>(
        `/events/${identifier}`,
        eventData,
      );
      if (response.data.success) {
        return response.data.data.event;
      } else {
        throw new Error(
          response.data.message || "Impossible de mettre à jour l'événement",
        );
      }
    }

    // Sinon, utiliser FormData comme avant
    const formData = new FormData();

    // Ajouter les données de l'événement
    addToFormData(formData, eventData);

    // Ajouter l'image si fournie
    if (mainImage) {
      formData.append("main_image", mainImage);
    }

    const response = await api.put<ApiResponse<{ event: Event }>>(
      `/events/${identifier}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (response.data.success) {
      return response.data.data.event;
    } else {
      throw new Error(
        response.data.message || "Impossible de mettre à jour l'événement",
      );
    }
  },

  delete: async (identifier: string | number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(
      `/events/${identifier}`,
    );
    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer l'événement",
      );
    }
  },

  // Upload d'image dédié pour un événement
  uploadImage: async (id: number, imageFile: File): Promise<Event> => {
    const formData = new FormData();
    formData.append("main_image", imageFile);

    const response = await api.post<ApiResponse<{ event: Event }>>(
      `/events/${id}/upload-image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (response.data.success) {
      return response.data.data.event;
    } else {
      throw new Error(response.data.message || "Impossible d'uploader l'image");
    }
  },

  // Suppression d'image dédiée pour un événement
  removeImage: async (id: number): Promise<Event> => {
    const response = await api.delete<ApiResponse<{ event: Event }>>(
      `/events/${id}/remove-image`,
    );
    if (response.data.success) {
      return response.data.data.event;
    } else {
      throw new Error(
        response.data.message || "Impossible de supprimer l'image",
      );
    }
  },

  // === MÉTHODES POUR LA GALERIE ===

  // Upload d'images de galerie
  uploadGalleryImages: async (
    id: number,
    imageFiles: File[],
  ): Promise<Image[]> => {
    const formData = new FormData();

    imageFiles.forEach((file) => {
      formData.append("images[]", file);
    });

    const response = await api.post<ApiResponse<{ images: Image[] }>>(
      `/events/${id}/gallery/upload-multiple`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (response.data.success) {
      return response.data.data.images;
    } else {
      throw new Error(
        response.data.message || "Impossible d'uploader les images de galerie",
      );
    }
  },

  // Upload d'une seule image de galerie
  uploadGalleryImage: async (
    id: number,
    imageFile: File,
    options?: {
      alt_text?: string;
      description?: string;
      sort_order?: number;
    },
  ): Promise<Image> => {
    const formData = new FormData();
    formData.append("image", imageFile);

    if (options?.alt_text) {
      formData.append("alt_text", options.alt_text);
    }
    if (options?.description) {
      formData.append("description", options.description);
    }
    if (options?.sort_order !== undefined) {
      formData.append("sort_order", options.sort_order.toString());
    }

    const response = await api.post<ApiResponse<{ image: Image }>>(
      `/events/${id}/gallery/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (response.data.success) {
      return response.data.data.image;
    } else {
      throw new Error(
        response.data.message || "Impossible d'uploader l'image de galerie",
      );
    }
  },

  // Récupérer les images de galerie
  getGalleryImages: async (id: number): Promise<Image[]> => {
    const response = await api.get<ApiResponse<{ images: Image[] }>>(
      `/events/${id}/gallery`,
    );
    if (response.data.success) {
      return response.data.data.images;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les images de galerie",
      );
    }
  },

  // Supprimer une image de galerie
  removeGalleryImage: async (
    eventId: number,
    imageId: number,
  ): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(
      `/events/${eventId}/gallery/${imageId}`,
    );
    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer l'image de galerie",
      );
    }
  },

  // Réorganiser les images de galerie
  reorderGalleryImages: async (
    id: number,
    imageOrders: Array<{
      id: number;
      sort_order: number;
    }>,
  ): Promise<void> => {
    const response = await api.put<ApiResponse<null>>(
      `/events/${id}/gallery/reorder`,
      { images: imageOrders },
    );
    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Impossible de réorganiser les images de galerie",
      );
    }
  },

  // Supprimer toutes les images de galerie
  clearGalleryImages: async (
    id: number,
  ): Promise<{ deleted_count: number }> => {
    const response = await api.delete<ApiResponse<{ deleted_count: number }>>(
      `/events/${id}/gallery/clear`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de supprimer les images de galerie",
      );
    }
  },

  // Associer un point physique à un événement
  attachPoint: async (
    eventId: number,
    physicalPointId: number,
  ): Promise<void> => {
    const response = await api.post<ApiResponse<null>>(`/events/attach-point`, {
      event_id: eventId,
      physical_point_id: physicalPointId,
    });
    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Impossible d'associer le point de retrait à l'événement",
      );
    }
  },

  /** Points de livraison liés à un événement */
  getDeliveryPointsForEvent: async (
    eventId: number,
  ): Promise<DeliveryPoint[]> => {
    const response = await api.get<ApiResponse<DeliveryPointApiRow[]>>(
      `/events/${eventId}/delivery-points`,
    );
    if (response.data.success) {
      return (response.data.data || []).map(deliveryPointFromApi);
    }
    throw new Error(
      response.data.message ||
        "Impossible de récupérer les points de livraison de l'événement",
    );
  },

  attachDeliveryPoint: async (
    eventId: number,
    deliveryPointId: number,
  ): Promise<void> => {
    const response = await api.post<ApiResponse<null>>(
      `/events/attach-delivery-point`,
      {
        event_id: eventId,
        delivery_point_id: deliveryPointId,
      },
    );
    if (!response.data.success) {
      const msg =
        (response.data as { message?: string }).message ||
        "Impossible d'associer le point de livraison à l'événement";
      throw new Error(msg);
    }
  },

  detachDeliveryPoint: async (
    eventId: number,
    deliveryPointId: number,
  ): Promise<void> => {
    const response = await api.post<ApiResponse<null>>(
      `/events/detach-delivery-point`,
      {
        event_id: eventId,
        delivery_point_id: deliveryPointId,
      },
    );
    if (!response.data.success) {
      const msg =
        (response.data as { message?: string }).message ||
        "Impossible de retirer le point de livraison de l'événement";
      throw new Error(msg);
    }
  },
};

// Services API pour les activités
export const activitiesAPI = {
  // Récupérer la liste des activités pour un événement
  getByEventId: async (eventId: number): Promise<Activity[]> => {
    const response = await api.get<ApiResponse<Activity[]>>(
      `/activities?event_id=${eventId}`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer la liste des activités",
      );
    }
  },

  // Récupérer une activité par ID
  getById: async (id: number): Promise<Activity> => {
    const response = await api.get<ApiResponse<Activity>>(`/activities/${id}`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les détails de l'activité",
      );
    }
  },

  // Créer une nouvelle activité
  create: async (activityData: CreateActivityData): Promise<Activity> => {
    const response = await api.post<ApiResponse<{ activity: Activity }>>(
      "/activities",
      activityData,
    );
    if (response.data.success) {
      return response.data.data.activity;
    } else {
      throw new Error(
        response.data.message || "Impossible de créer l'activité",
      );
    }
  },

  // Mettre à jour une activité
  update: async (
    id: number,
    activityData: UpdateActivityData,
  ): Promise<Activity> => {
    const response = await api.put<ApiResponse<{ activity: Activity }>>(
      `/activities/${id}`,
      activityData,
    );
    if (response.data.success) {
      return response.data.data.activity;
    } else {
      throw new Error(
        response.data.message || "Impossible de mettre à jour l'activité",
      );
    }
  },

  // Supprimer une activité
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/activities/${id}`);
    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer l'activité",
      );
    }
  },
};

// Services API pour les tickets
export const ticketsAPI = {
  // Récupérer la liste des tickets pour un événement
  getByEventId: async (eventId: number): Promise<Ticket[]> => {
    const response = await api.get<ApiResponse<Ticket[]>>(
      `/tickets?event_id=${eventId}`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de récupérer la liste des tickets",
      );
    }
  },

  // Récupérer un ticket par ID
  getById: async (id: number): Promise<Ticket> => {
    const response = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les détails du ticket",
      );
    }
  },

  // Créer un nouveau ticket
  create: async (ticketData: CreateTicketData): Promise<Ticket> => {
    const response = await api.post<ApiResponse<{ ticket: Ticket }>>(
      "/tickets",
      ticketData,
    );
    if (response.data.success) {
      return response.data.data.ticket;
    } else {
      throw new Error(response.data.message || "Impossible de créer le ticket");
    }
  },

  // Mettre à jour un ticket
  update: async (id: number, ticketData: UpdateTicketData): Promise<Ticket> => {
    const response = await api.put<ApiResponse<{ ticket: Ticket }>>(
      `/tickets/${id}`,
      ticketData,
    );
    if (response.data.success) {
      return response.data.data.ticket;
    } else {
      throw new Error(
        response.data.message || "Impossible de mettre à jour le ticket",
      );
    }
  },

  // Supprimer un ticket
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/tickets/${id}`);
    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer le ticket",
      );
    }
  },

  // Upload d'image publique dédié pour un ticket
  uploadPublicImage: async (id: number, imageFile: File): Promise<Ticket> => {
    const formData = new FormData();
    formData.append("public_image", imageFile);

    const response = await api.post<ApiResponse<{ ticket: Ticket }>>(
      `/tickets/${id}/upload-public-image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (response.data.success) {
      return response.data.data.ticket;
    } else {
      throw new Error(
        response.data.message || "Impossible d'uploader l'image publique",
      );
    }
  },

  // Upload d'image template dédié pour un ticket
  uploadTemplateImage: async (id: number, imageFile: File): Promise<Ticket> => {
    const formData = new FormData();
    formData.append("template_image", imageFile);

    const response = await api.post<ApiResponse<{ ticket: Ticket }>>(
      `/tickets/${id}/upload-template-image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (response.data.success) {
      return response.data.data.ticket;
    } else {
      throw new Error(
        response.data.message || "Impossible d'uploader l'image template",
      );
    }
  },

  // Suppression d'image publique dédiée pour un ticket
  removePublicImage: async (id: number): Promise<Ticket> => {
    const response = await api.delete<ApiResponse<{ ticket: Ticket }>>(
      `/tickets/${id}/remove-public-image`,
    );
    if (response.data.success) {
      return response.data.data.ticket;
    } else {
      throw new Error(
        response.data.message || "Impossible de supprimer l'image publique",
      );
    }
  },

  // Suppression d'image template dédiée pour un ticket
  removeTemplateImage: async (id: number): Promise<Ticket> => {
    const response = await api.delete<ApiResponse<{ ticket: Ticket }>>(
      `/tickets/${id}/remove-template-image`,
    );
    if (response.data.success) {
      return response.data.data.ticket;
    } else {
      throw new Error(
        response.data.message || "Impossible de supprimer l'image template",
      );
    }
  },

  // Gestion du stock
  // Consulter le stock
  getStocks: async (
    ticketId: number,
  ): Promise<{
    ticket: {
      id: number;
      name: string;
      quantity_acquired: number | null;
      quantity_sold: number;
      sellable_stock: number;
    };
  }> => {
    const response = await api.get<
      ApiResponse<{
        ticket: {
          id: number;
          name: string;
          quantity_acquired: number | null;
          quantity_sold: number;
          sellable_stock: number;
        };
      }>
    >(`/tickets/${ticketId}/stocks`);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de récupérer le stock",
      );
    }
  },

  // Acquérir du stock
  acquireStock: async (ticketId: number, quantity: number): Promise<Ticket> => {
    const response = await api.post<ApiResponse<{ ticket: Ticket }>>(
      `/tickets/${ticketId}/stocks/acquire`,
      { quantity },
    );

    if (response.data.success) {
      return response.data.data.ticket;
    } else {
      throw new Error(
        response.data.message || "Impossible d'acquérir le stock",
      );
    }
  },

  // Diminuer le stock
  decreaseStock: async (
    ticketId: number,
    quantity: number,
  ): Promise<Ticket> => {
    const response = await api.post<ApiResponse<{ ticket: Ticket }>>(
      `/tickets/${ticketId}/stocks/decrease`,
      { quantity },
    );

    if (response.data.success) {
      return response.data.data.ticket;
    } else {
      throw new Error(
        response.data.message || "Impossible de diminuer le stock",
      );
    }
  },

  // Ajuster le stock (delta positif ou négatif)
  adjustStock: async (ticketId: number, delta: number): Promise<Ticket> => {
    const response = await api.post<ApiResponse<{ ticket: Ticket }>>(
      `/tickets/${ticketId}/stocks/adjust`,
      { delta },
    );

    if (response.data.success) {
      return response.data.data.ticket;
    } else {
      throw new Error(response.data.message || "Impossible d'ajuster le stock");
    }
  },

  // Définir le stock initial (peut être null pour stock illimité)
  setInitialStock: async (
    ticketId: number,
    quantity: number | null,
  ): Promise<Ticket> => {
    const response = await api.post<ApiResponse<{ ticket: Ticket }>>(
      `/tickets/${ticketId}/stocks/set-initial`,
      { quantity },
    );

    if (response.data.success) {
      return response.data.data.ticket;
    } else {
      throw new Error(
        response.data.message || "Impossible de définir le stock initial",
      );
    }
  },
};

// Services API pour les produits
export const productsAPI = {
  // Récupérer la liste des produits pour un événement
  getByEventId: async (eventId: number): Promise<Product[]> => {
    const response = await api.get<ApiResponse<Product[]>>(
      `/products?event_id=${eventId}`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer la liste des produits",
      );
    }
  },

  // Récupérer un produit par ID
  getById: async (id: number): Promise<Product> => {
    const response = await api.get<ApiResponse<{ product: Product }>>(
      `/products/${id}`,
    );
    if (response.data.success) {
      return response.data.data.product;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les détails du produit",
      );
    }
  },

  // Créer un nouveau produit
  create: async (
    productData: CreateProductData,
    mainImage?: File,
  ): Promise<Product> => {
    const formData = new FormData();

    // Ajouter les données du produit
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Ajouter l'image si fournie
    if (mainImage) {
      formData.append("main_image", mainImage);
    }

    const response = await api.post<ApiResponse<{ product: Product }>>(
      "/products",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (response.data.success) {
      return response.data.data.product;
    } else {
      throw new Error(
        response.data.message || "Impossible de créer le produit",
      );
    }
  },

  // Mettre à jour un produit
  update: async (
    id: number,
    productData: UpdateProductData,
    mainImage?: File,
  ): Promise<Product> => {
    // Si pas d'image, envoyer en JSON
    if (!mainImage) {
      const response = await api.put<ApiResponse<{ product: Product }>>(
        `/products/${id}`,
        productData,
      );
      if (response.data.success) {
        return response.data.data.product;
      } else {
        throw new Error(
          response.data.message || "Impossible de mettre à jour le produit",
        );
      }
    }

    // Sinon, utiliser FormData
    const formData = new FormData();

    // Ajouter les données du produit
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Ajouter l'image
    formData.append("main_image", mainImage);

    const response = await api.put<ApiResponse<{ product: Product }>>(
      `/products/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (response.data.success) {
      return response.data.data.product;
    } else {
      throw new Error(
        response.data.message || "Impossible de mettre à jour le produit",
      );
    }
  },

  // Supprimer un produit
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/products/${id}`);
    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer le produit",
      );
    }
  },

  // Upload d'image dédié pour un produit
  uploadImage: async (id: number, imageFile: File): Promise<Product> => {
    const formData = new FormData();
    formData.append("main_image", imageFile);

    const response = await api.post<ApiResponse<{ product: Product }>>(
      `/products/${id}/upload-image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (response.data.success) {
      return response.data.data.product;
    } else {
      throw new Error(response.data.message || "Impossible d'uploader l'image");
    }
  },

  // Suppression d'image dédiée pour un produit
  removeImage: async (id: number): Promise<Product> => {
    const response = await api.delete<ApiResponse<{ product: Product }>>(
      `/products/${id}/remove-image`,
    );
    if (response.data.success) {
      return response.data.data.product;
    } else {
      throw new Error(
        response.data.message || "Impossible de supprimer l'image",
      );
    }
  },

  // Acquérir du stock pour un produit
  acquireStock: async (
    productId: number,
    physicalPointId: number,
    quantity: number,
  ): Promise<Product> => {
    const response = await api.post<ApiResponse<{ product: Product }>>(
      `/products/${productId}/stocks/acquire`,
      {
        physical_point_id: physicalPointId,
        quantity: quantity,
      },
    );
    if (response.data.success) {
      return response.data.data.product;
    } else {
      throw new Error(
        response.data.message || "Impossible d'acquérir le stock",
      );
    }
  },

  // Ajuster le stock (augmentation ou diminution)
  adjustStock: async (
    productId: number,
    physicalPointId: number,
    delta: number,
  ): Promise<Product> => {
    const response = await api.post<ApiResponse<{ product: Product }>>(
      `/products/${productId}/stocks/adjust`,
      {
        physical_point_id: physicalPointId,
        delta: delta,
      },
    );
    if (response.data.success) {
      return response.data.data.product;
    } else {
      throw new Error(response.data.message || "Impossible d'ajuster le stock");
    }
  },

  // Récupérer les stocks détaillés par point physique
  getStocks: async (
    productId: number,
  ): Promise<{
    product: {
      id: number;
      name: string;
      quantity_acquired: number;
      quantity_sold: number;
      quantity_withdrawn: number;
      sellable_stock: number;
      real_stock: number;
    };
    point_stocks: Array<{
      id: number;
      physical_point_id: number;
      physical_point_name: string;
      quantity_acquired: number;
      quantity_sold: number;
      quantity_withdrawn: number;
      sellable_stock: number;
      real_stock: number;
    }>;
  }> => {
    const response = await api.get<
      ApiResponse<{
        product: {
          id: number;
          name: string;
          quantity_acquired: number;
          quantity_sold: number;
          quantity_withdrawn: number;
          sellable_stock: number;
          real_stock: number;
        };
        point_stocks: Array<{
          id: number;
          physical_point_id: number;
          physical_point_name: string;
          quantity_acquired: number;
          quantity_sold: number;
          quantity_withdrawn: number;
          sellable_stock: number;
          real_stock: number;
        }>;
      }>
    >(`/products/${productId}/stocks`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de récupérer les stocks détaillés",
      );
    }
  },
};

// Services API pour les images
export const imagesAPI = {
  // Uploader une image
  upload: async (file: File): Promise<{ id: number; url: string }> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post<ApiResponse<{ id: number; url: string }>>(
      "/images/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Impossible d'uploader l'image");
    }
  },

  // Supprimer une image
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/images/${id}`);
    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer l'image",
      );
    }
  },
};

// Services API pour les parkings
export const parkingsAPI = {
  // Récupérer tous les parkings
  getAll: async (params?: {
    event_id?: number;
    status?: string;
    parking_type_id?: number;
    available_for_sale?: boolean;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
    page?: number;
  }): Promise<{
    data: Parking[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }> => {
    const response = await api.get<
      ApiResponse<{
        data: Parking[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      }>
    >("/parkings", { params });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de récupérer les parkings",
      );
    }
  },

  // Récupérer un parking par ID
  getById: async (id: number): Promise<Parking> => {
    const response = await api.get<ApiResponse<Parking>>(`/parkings/${id}`);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de récupérer le parking",
      );
    }
  },

  // Récupérer les parkings d'un événement
  getByEvent: async (
    eventId: number,
    params?: {
      status?: string;
      available_for_sale?: boolean;
    },
  ): Promise<Parking[]> => {
    const response = await api.get<ApiResponse<Parking[]>>(
      `/events/${eventId}/parkings`,
      { params },
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les parkings de l'événement",
      );
    }
  },

  // Créer un parking
  create: async (parkingData: CreateParkingData): Promise<Parking> => {
    const response = await api.post<ApiResponse<Parking>>(
      "/parkings",
      parkingData,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de créer le parking",
      );
    }
  },

  // Mettre à jour un parking
  update: async (
    id: number,
    parkingData: Partial<CreateParkingData>,
  ): Promise<Parking> => {
    const response = await api.put<ApiResponse<Parking>>(
      `/parkings/${id}`,
      parkingData,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de mettre à jour le parking",
      );
    }
  },

  // Supprimer un parking
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/parkings/${id}`);

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer le parking",
      );
    }
  },

  // Basculer la disponibilité à la vente directe
  toggleDirectSale: async (id: number): Promise<Parking> => {
    const response = await api.patch<ApiResponse<Parking>>(
      `/parkings/${id}/toggle-direct-sale`,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de basculer la disponibilité",
      );
    }
  },

  // Gestion du stock
  // Consulter le stock
  getStocks: async (
    parkingId: number,
  ): Promise<{
    parking: {
      id: number;
      name: string;
      quantity_acquired: number | null;
      quantity_sold: number;
      sellable_stock: number;
    };
  }> => {
    const response = await api.get<
      ApiResponse<{
        parking: {
          id: number;
          name: string;
          quantity_acquired: number | null;
          quantity_sold: number;
          sellable_stock: number;
        };
      }>
    >(`/parkings/${parkingId}/stocks`);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de récupérer le stock",
      );
    }
  },

  // Acquérir du stock
  acquireStock: async (
    parkingId: number,
    quantity: number,
  ): Promise<Parking> => {
    const response = await api.post<ApiResponse<Parking>>(
      `/parkings/${parkingId}/stocks/acquire`,
      { quantity },
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible d'acquérir le stock",
      );
    }
  },

  // Diminuer le stock
  decreaseStock: async (
    parkingId: number,
    quantity: number,
  ): Promise<Parking> => {
    const response = await api.post<ApiResponse<Parking>>(
      `/parkings/${parkingId}/stocks/decrease`,
      { quantity },
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de diminuer le stock",
      );
    }
  },

  // Ajuster le stock (delta positif ou négatif)
  adjustStock: async (parkingId: number, delta: number): Promise<Parking> => {
    const response = await api.post<ApiResponse<Parking>>(
      `/parkings/${parkingId}/stocks/adjust`,
      { delta },
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Impossible d'ajuster le stock");
    }
  },

  // Définir le stock initial (peut être null pour stock illimité)
  setInitialStock: async (
    parkingId: number,
    quantity: number | null,
  ): Promise<Parking> => {
    const response = await api.post<ApiResponse<Parking>>(
      `/parkings/${parkingId}/stocks/set-initial`,
      { quantity },
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de définir le stock initial",
      );
    }
  },
};

// Services API pour les types de parking
export const parkingTypesAPI = {
  // Récupérer tous les types de parking
  getAll: async (organizerId?: number): Promise<ParkingType[]> => {
    const params = organizerId ? { organizer_id: organizerId } : {};
    const response = await api.get<ApiResponse<ParkingType[]>>(
      "/parking-types",
      { params },
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de récupérer les types de parking",
      );
    }
  },

  // Récupérer un type de parking par ID
  getById: async (id: number): Promise<ParkingType> => {
    const response = await api.get<ApiResponse<ParkingType>>(
      `/parking-types/${id}`,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de récupérer le type de parking",
      );
    }
  },

  // Créer un type de parking
  create: async (typeData: {
    organizer_id: number;
    name: string;
    description?: string;
    is_active?: boolean;
  }): Promise<ParkingType> => {
    const response = await api.post<ApiResponse<ParkingType>>(
      "/parking-types",
      typeData,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de créer le type de parking",
      );
    }
  },

  // Mettre à jour un type de parking
  update: async (
    id: number,
    typeData: {
      name?: string;
      description?: string;
      is_active?: boolean;
    },
  ): Promise<ParkingType> => {
    const response = await api.put<ApiResponse<ParkingType>>(
      `/parking-types/${id}`,
      typeData,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de mettre à jour le type de parking",
      );
    }
  },

  // Supprimer un type de parking
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(
      `/parking-types/${id}`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer le type de parking",
      );
    }
  },

  // Basculer le statut d'un type de parking
  toggleStatus: async (id: number): Promise<ParkingType> => {
    const response = await api.patch<ApiResponse<ParkingType>>(
      `/parking-types/${id}/toggle-status`,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de basculer le statut",
      );
    }
  },
};

// Services API pour les règles d'attribution de parking
export const parkingRulesAPI = {
  // Récupérer toutes les règles de parking
  getAll: async (params?: {
    event_id?: number;
    is_visible?: boolean;
    is_currently_valid?: boolean;
  }): Promise<ParkingRule[]> => {
    const response = await api.get<ApiResponse<ParkingRule[]>>(
      "/parking-rules",
      { params },
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les règles de parking",
      );
    }
  },

  // Récupérer une règle de parking par ID
  getById: async (id: number): Promise<ParkingRule> => {
    const response = await api.get<ApiResponse<ParkingRule>>(
      `/parking-rules/${id}`,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de récupérer la règle de parking",
      );
    }
  },

  // Récupérer les règles de parking d'un événement
  getByEvent: async (eventId: number): Promise<ParkingRule[]> => {
    const response = await api.get<ApiResponse<ParkingRule[]>>(
      `/events/${eventId}/parking-rules`,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les règles de parking de l'événement",
      );
    }
  },

  // Créer une règle de parking
  create: async (ruleData: CreateParkingRuleData): Promise<ParkingRule> => {
    const response = await api.post<ApiResponse<ParkingRule>>(
      "/parking-rules",
      ruleData,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de créer la règle de parking",
      );
    }
  },

  // Mettre à jour une règle de parking
  update: async (
    id: number,
    ruleData: UpdateParkingRuleData,
  ): Promise<ParkingRule> => {
    const response = await api.put<ApiResponse<ParkingRule>>(
      `/parking-rules/${id}`,
      ruleData,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de mettre à jour la règle de parking",
      );
    }
  },

  // Supprimer une règle de parking
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(
      `/parking-rules/${id}`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer la règle de parking",
      );
    }
  },

  // Basculer la visibilité d'une règle de parking
  toggleVisibility: async (id: number): Promise<ParkingRule> => {
    const response = await api.patch<ApiResponse<ParkingRule>>(
      `/parking-rules/${id}/toggle-visibility`,
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de basculer la visibilité",
      );
    }
  },
};

// Services API pour les commandes
export const ordersAPI = {
  // Récupérer la liste des commandes pour un événement
  getByEventId: async (eventId: number): Promise<Order[]> => {
    const response = await api.get<ApiResponse<Order[]>>(
      `/orders?event_id=${eventId}`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer la liste des commandes",
      );
    }
  },

  // Récupérer une commande par ID
  getById: async (id: number): Promise<Order> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les détails de la commande",
      );
    }
  },

  // Renvoyer les notifications d'une commande
  resendNotifications: async (params: {
    order_id: number;
    channels: ("mail" | "whatsapp")[];
    email?: string;
    phone?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      order_number: string;
      results: {
        mail?: { sent: boolean; to: string; error?: string };
        whatsapp?: { sent: boolean; to: string; error?: string };
      };
    };
  }> => {
    const response = await api.post("/orders/resend-notifications", params);
    return response.data;
  },
};

// Services API pour les points physiques
export const physicalPointsAPI = {
  // Récupérer la liste des points physiques
  getAll: async (params?: {
    event_id?: number;
    organizer_id?: number;
    tyva?: number;
  }): Promise<PhysicalPoint[]> => {
    const response = await api.get<ApiResponse<PhysicalPoint[]>>(
      "/physical-points",
      { params },
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer la liste des points physiques",
      );
    }
  },

  // Récupérer les points physiques par organisateur
  getByOrganizerId: async (
    organizerId: number,
    params?: { tyva?: number },
  ): Promise<PhysicalPoint[]> => {
    const queryParams = {
      organizer_id: organizerId,
      tyva: params?.tyva ?? 1,
    };
    const response = await api.get<ApiResponse<PhysicalPoint[]>>(
      "/physical-points",
      { params: queryParams },
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les points physiques de l'organisateur",
      );
    }
  },

  // Récupérer les points physiques par événement
  getByEventId: async (eventId: number): Promise<PhysicalPoint[]> => {
    const response = await api.get<ApiResponse<PhysicalPoint[]>>(
      `/physical-points?event_id=${eventId}`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les points physiques de l'événement",
      );
    }
  },

  // Récupérer un point physique par ID
  getById: async (id: number): Promise<PhysicalPoint> => {
    const response = await api.get<ApiResponse<PhysicalPoint>>(
      `/physical-points/${id}`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les détails du point physique",
      );
    }
  },

  // Créer un nouveau point physique
  create: async (
    pointData: CreatePhysicalPointData,
  ): Promise<PhysicalPoint> => {
    const response = await api.post<ApiResponse<PhysicalPoint>>(
      "/physical-points",
      pointData,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de créer le point physique",
      );
    }
  },

  // Mettre à jour un point physique
  update: async (
    id: number,
    pointData: UpdatePhysicalPointData,
  ): Promise<PhysicalPoint> => {
    const response = await api.put<ApiResponse<PhysicalPoint>>(
      `/physical-points/${id}`,
      pointData,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de mettre à jour le point physique",
      );
    }
  },

  // Supprimer un point physique
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(
      `/physical-points/${id}`,
    );
    if (!response.data.success) {
      throw new Error(
        response.data.message || "Impossible de supprimer le point physique",
      );
    }
  },
};

// Services API pour les points de livraison (catalogue backoffice)
export const deliveryPointsAPI = {
  getAll: async (params?: {
    organizer_id?: number;
    tyva?: boolean;
    event_id?: number;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }): Promise<DeliveryPoint[]> => {
    const { tyva, ...rest } = params || {};
    const query: Record<string, unknown> = { ...rest };
    if (tyva !== undefined) {
      query.tyva = tyva ? 1 : 0;
    }
    const response = await api.get<ApiResponse<DeliveryPointApiRow[]>>(
      "/delivery-points",
      { params: query },
    );
    if (response.data.success) {
      return (response.data.data || []).map(deliveryPointFromApi);
    }
    throw new Error(
      response.data.message ||
        "Impossible de récupérer la liste des points de livraison",
    );
  },

  getByOrganizerId: async (
    organizerId: number,
    params?: { tyva?: boolean },
  ): Promise<DeliveryPoint[]> => {
    const tyva = params?.tyva ?? true;
    const response = await api.get<ApiResponse<DeliveryPointApiRow[]>>(
      "/delivery-points",
      {
        params: {
          organizer_id: organizerId,
          tyva: tyva ? 1 : 0,
        },
      },
    );
    if (response.data.success) {
      return (response.data.data || []).map(deliveryPointFromApi);
    }
    throw new Error(
      response.data.message ||
        "Impossible de récupérer les points de livraison de l'organisateur",
    );
  },

  getById: async (id: number): Promise<DeliveryPoint> => {
    const response = await api.get<ApiResponse<DeliveryPointApiRow>>(
      `/delivery-points/${id}`,
    );
    if (response.data.success) {
      return deliveryPointFromApi(response.data.data);
    }
    throw new Error(
      response.data.message ||
        "Impossible de récupérer le point de livraison",
    );
  },

  create: async (
    data: DeliveryPointFormData,
    options?: { organizerId?: number | null },
  ): Promise<DeliveryPoint> => {
    const organizerId = options?.organizerId !== undefined ? options.organizerId : null;
    const response = await api.post<ApiResponse<DeliveryPointApiRow>>(
      "/delivery-points",
      deliveryPointFormToCreateBody(data, organizerId),
    );
    if (response.data.success) {
      return deliveryPointFromApi(response.data.data);
    }
    throw new Error(
      response.data.message || "Impossible de créer le point de livraison",
    );
  },

  update: async (
    id: number,
    data: DeliveryPointFormData,
  ): Promise<DeliveryPoint> => {
    const response = await api.put<ApiResponse<DeliveryPointApiRow>>(
      `/delivery-points/${id}`,
      deliveryPointFormToUpdateBody(data),
    );
    if (response.data.success) {
      return deliveryPointFromApi(response.data.data);
    }
    throw new Error(
      response.data.message ||
        "Impossible de mettre à jour le point de livraison",
    );
  },

  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(
      `/delivery-points/${id}`,
    );
    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Impossible de supprimer le point de livraison",
      );
    }
  },

  /** Lie la zone au point physique dont le stock sera déduit (commandes livrées). */
  linkToPhysicalPoint: async (payload: {
    physical_point_id: number;
    delivery_point_id: number;
  }): Promise<DeliveryPoint> => {
    const response = await api.post<ApiResponse<DeliveryPointApiRow>>(
      "/delivery-points/link-to-physical-point",
      payload,
    );
    if (response.data.success && response.data.data) {
      return deliveryPointFromApi(response.data.data as DeliveryPointApiRow);
    }
    throw new Error(
      (response.data as { message?: string }).message ||
        "Impossible d'associer le point de livraison au point de retrait",
    );
  },

  unlinkFromPhysicalPoint: async (
    deliveryPointId: number,
  ): Promise<DeliveryPoint> => {
    const response = await api.post<ApiResponse<DeliveryPointApiRow>>(
      "/delivery-points/unlink-from-physical-point",
      { delivery_point_id: deliveryPointId },
    );
    if (response.data.success && response.data.data) {
      return deliveryPointFromApi(response.data.data as DeliveryPointApiRow);
    }
    throw new Error(
      (response.data as { message?: string }).message ||
        "Impossible de dissocier le point de retrait",
    );
  },
};

// Services API pour les demandes d'événements
export const eventRequestsAPI = {
  // Récupérer la liste des demandes d'événements avec pagination
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<EventRequest>> => {
    const response = await api.get<
      ApiResponse<PaginatedResponse<EventRequest>>
    >("/delegation-requests", { params });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer la liste des demandes d'événements",
      );
    }
  },

  // Récupérer une demande d'événement par ID
  getById: async (id: number): Promise<EventRequest> => {
    const response = await api.get<ApiResponse<EventRequest>>(
      `/delegation-requests/${id}`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les détails de la demande d'événement",
      );
    }
  },

  // Mettre à jour le statut d'une demande d'événement
  updateStatus: async (
    id: number,
    status: "new" | "in_review" | "processed" | "rejected",
    handledByUserId?: number,
  ): Promise<EventRequest> => {
    const response = await api.put<ApiResponse<EventRequest>>(
      `/delegation-requests/${id}`,
      {
        status,
        handled_by_user_id: handledByUserId,
      },
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de mettre à jour le statut de la demande d'événement",
      );
    }
  },

  // Assigner une demande à un organisateur
  assignToOrganizer: async (
    id: number,
    organizerId: number,
  ): Promise<EventRequest> => {
    const response = await api.put<ApiResponse<EventRequest>>(
      `/delegation-requests/${id}`,
      {
        organizer_id: organizerId,
      },
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible d'assigner la demande à l'organisateur",
      );
    }
  },
};

// Types pour les logs (réponses API)
export interface LogFileInfo {
  filename: string;
  size: string;
  size_bytes: number;
  last_modified: string;
}

export interface LogsListResponse {
  files: LogFileInfo[];
  total: number;
}

export interface LogLine {
  line_number: number;
  content: string;
  level: string;
}

export interface LogContentResponse {
  filename: string;
  total_lines: number;
  showing_from: number;
  showing_to: number;
  lines: LogLine[];
  filters?: { search?: string; level?: string };
}

// Services API pour les logs
export const logsAPI = {
  /** Liste tous les fichiers de log (nom, taille, date de modification) */
  getList: async (): Promise<LogFileInfo[]> => {
    const response = await api.get<ApiResponse<LogsListResponse>>("/logs");
    if (response.data.success && response.data.data?.files) {
      return response.data.data.files;
    }
    throw new Error(
      response.data.message || "Impossible de récupérer la liste des logs",
    );
  },

  /** Contenu d'un fichier de log avec pagination (lines/offset) et filtres (search, level, date) */
  getContent: async (
    filename: string,
    params?: {
      lines?: number;
      offset?: number;
      search?: string;
      level?: string;
      /** Un seul jour (YYYY-MM-DD) */
      date?: string;
      /** Début de plage (YYYY-MM-DD) */
      from_date?: string;
      /** Fin de plage (YYYY-MM-DD) */
      to_date?: string;
    },
  ): Promise<LogContentResponse> => {
    const response = await api.get<ApiResponse<LogContentResponse>>(
      `/logs/${encodeURIComponent(filename)}`,
      { params },
    );
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(
      response.data.message || "Impossible de récupérer le contenu du log",
    );
  },

  /** Télécharge un fichier de log */
  download: async (filename: string): Promise<Blob> => {
    const response = await api.get(`/logs/${encodeURIComponent(filename)}/download`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  /** Supprime un fichier de log (laravel.log est vidé, pas supprimé) */
  delete: async (filename: string): Promise<void> => {
    const res = await api.delete<ApiResponse<null>>(
      `/logs/${encodeURIComponent(filename)}`,
    );
    if (!res.data.success) {
      throw new Error(res.data.message || "Impossible de supprimer le log");
    }
  },

  /** Vide le contenu de tous les fichiers .log sans les supprimer */
  clearAll: async (): Promise<void> => {
    const res = await api.post<ApiResponse<null>>("/logs/clear");
    if (!res.data.success) {
      throw new Error(res.data.message || "Impossible de vider les logs");
    }
  },
};

// Services API pour les règles d'attribution Produit/Ticket
export const productTicketAttributionRulesAPI = {
  // Récupérer la liste des règles (avec filtres facultatifs)
  getAll: async (params?: {
    event_id?: number;
    search?: string;
    is_visible?: boolean;
    application_mode?: "many_times" | "one_time";
    active_only?: boolean;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }): Promise<ProductTicketAttributionRule[]> => {
    const response = await api.get<ApiResponse<ProductTicketAttributionRule[]>>(
      "/product-ticket-attribution-rules",
      { params },
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les règles d'attribution",
      );
    }
  },

  // Récupérer une règle par ID
  getById: async (ruleId: number): Promise<ProductTicketAttributionRule> => {
    const response = await api.get<ApiResponse<ProductTicketAttributionRule>>(
      `/product-ticket-attribution-rules/${ruleId}`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer la règle d'attribution",
      );
    }
  },

  // Créer une règle
  create: async (
    data: CreateAttributionRuleData,
  ): Promise<ProductTicketAttributionRule> => {
    const response = await api.post<ApiResponse<ProductTicketAttributionRule>>(
      "/product-ticket-attribution-rules",
      data,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Impossible de créer la règle d'attribution",
      );
    }
  },

  // Mettre à jour une règle
  update: async (
    id: number,
    data: UpdateAttributionRuleData,
  ): Promise<ProductTicketAttributionRule> => {
    const response = await api.put<ApiResponse<ProductTicketAttributionRule>>(
      `/product-ticket-attribution-rules/${id}`,
      data,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de mettre à jour la règle d'attribution",
      );
    }
  },

  // Supprimer une règle
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(
      `/product-ticket-attribution-rules/${id}`,
    );
    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Impossible de supprimer la règle d'attribution",
      );
    }
  },
};

// Services API pour les règles d'attribution Parking/Ticket
export const parkingTicketRulesAPI = {
  // Récupérer la liste des règles (avec filtres facultatifs)
  getAll: async (params?: {
    event_id?: number;
    search?: string;
    is_visible?: boolean;
    access_mode?: "free" | "discount" | "paid_option";
    application_mode?: "per_threshold" | "once_if_threshold";
    is_active?: boolean;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }): Promise<ParkingTicketRule[]> => {
    const response = await api.get<ApiResponse<ParkingTicketRule[]>>(
      "/parking-rules",
      { params },
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer les règles d'attribution parking-ticket",
      );
    }
  },

  // Récupérer une règle par ID
  getById: async (ruleId: number): Promise<ParkingTicketRule> => {
    const response = await api.get<ApiResponse<ParkingTicketRule>>(
      `/parking-rules/${ruleId}`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de récupérer la règle d'attribution parking-ticket",
      );
    }
  },

  // Créer une règle
  create: async (
    data: CreateParkingTicketRuleData,
  ): Promise<ParkingTicketRule> => {
    const response = await api.post<ApiResponse<ParkingTicketRule>>(
      "/parking-rules",
      data,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de créer la règle d'attribution parking-ticket",
      );
    }
  },

  // Mettre à jour une règle
  update: async (
    id: number,
    data: UpdateParkingTicketRuleData,
  ): Promise<ParkingTicketRule> => {
    const response = await api.put<ApiResponse<ParkingTicketRule>>(
      `/parking-rules/${id}`,
      data,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de mettre à jour la règle d'attribution parking-ticket",
      );
    }
  },

  // Supprimer une règle
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(
      `/parking-rules/${id}`,
    );
    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Impossible de supprimer la règle d'attribution parking-ticket",
      );
    }
  },

  // Basculer la visibilité d'une règle
  toggleVisibility: async (id: number): Promise<ParkingTicketRule> => {
    const response = await api.patch<ApiResponse<ParkingTicketRule>>(
      `/parking-rules/${id}/toggle-visibility`,
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message ||
          "Impossible de basculer la visibilité de la règle",
      );
    }
  },
};
