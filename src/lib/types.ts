// Types centralisés pour l'application
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_verified: boolean;
  verification_code_expiry: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Types pour les rôles
export interface Role {
  id: number;
  name: string;
  is_glolab: boolean;
  pivot: {
    user_id: number;
    role_id: number;
    organizer_id: number | null;
  };
}

// Type pour l'assignation de rôle
export interface RoleAssignment {
  name: string;
  organizer_id?: number;
}

// Type pour les organisations
export interface Organization {
  id: number;
  user_id: number;
  company_name: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string;
  phone_number: string;
  address_street: string | null;
  address_city: string | null;
  address_postal_code: string | null;
  address_country: string;
  website_url: string | null;
  default_currency: string;
  bank_name: string | null;
  account_holder_name: string | null;
  account_number: string | null;
  swift_bic: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  font_family: string | null;
  created_at: string;
  updated_at: string;
}

// Type étendu User avec les rôles et organisations
export interface UserWithRoles extends User {
  roles: Role[];
  organizers?: Organization[];
}

// Types pour les opérations CRUD
export interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  password: string;
  password_confirmation?: string;
  is_verified?: boolean;
  roles: RoleAssignment[];
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  password?: string;
  password_confirmation?: string;
  is_verified?: boolean;
  roles?: RoleAssignment[];
}

// Types pour les rôles système
export type RoleType =
  | "super_admin"
  | "admin"
  | "staff"
  | "organizer_owner"
  | "organizer_admin"
  | "organizer_staff";

export interface RoleDefinition {
  name: RoleType;
  label: string;
  description: string;
  isGlobal: boolean;
  requiresOrganization: boolean;
}

// Types pour les opérations CRUD d'organisations
export interface CreateOrganizationData {
  company_name: string;
  description?: string;
  logo_url?: string;
  contact_email: string;
  phone_number: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country: string;
  website_url?: string;
  default_currency?: string;
}

export interface UpdateOrganizationData {
  company_name?: string;
  description?: string;
  logo_url?: string;
  contact_email?: string;
  phone_number?: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country?: string;
  website_url?: string;
  default_currency?: string;
}

// Types pour les images
export interface Image {
  id: number;
  filename: string;
  original_name: string;
  path: string;
  url: string;
  mime_type: string;
  extension: string;
  size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  description: string | null;
  type: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  imageable_type: string | null;
  imageable_id: number | null;
}

// Types pour les adresses
export interface Address {
  id: number;
  name: string;
  description: string | null;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  maps_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressData {
  name: string;
  description?: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  maps_link?: string;
}

/** Paramètres optionnels pour `GET /api/events` (EventController::index). */
export interface EventsListParams {
  search?: string;
  status?: string;
  event_type?: string;
  category?: string;
  organizer_id?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Types pour les événements
export interface Event {
  event_id: number;
  organizer_id: number;
  name: string;
  slug: string;
  category: string;
  event_type: "public" | "private";
  short_description: string;
  long_description: string;
  address_id: number | null;
  start_datetime: string;
  end_datetime: string;
  timezone: string | null;
  article_limit: number | null;
  ticket_validity_duration: number;
  practical_info: string | null;
  currency: string;
  status: "draft" | "published" | "cancelled" | "archived";
  main_image_id: number | null;
  created_at: string;
  updated_at: string;
  main_image_url: string | null;
  address: Address | null;
  main_image: Image | null;
  organizer?: Organization;
}

// Type simplifié pour les réponses API des produits
export interface EventSummary {
  event_id: number;
  name: string;
  organizer_id: number;
  main_image_url: string | null;
  organizer: {
    id: number;
    company_name: string;
  };
  main_image: Image | null;
}

export interface CreateEventData {
  name: string;
  organizer_id: number;
  category: string;
  event_type: "public" | "private";
  short_description: string;
  long_description: string;
  main_image_url?: string;
  start_datetime: string;
  end_datetime: string;
  timezone?: string;
  article_limit?: number;
  ticket_validity_duration: number;
  practical_info?: string;
  currency: string;
  status: "draft" | "published" | "cancelled" | "archived";
  address?: CreateAddressData;
}

export interface UpdateEventData {
  name?: string;
  organizer_id?: number;
  category?: string;
  event_type?: "public" | "private";
  short_description?: string;
  long_description?: string;
  main_image_url?: string;
  start_datetime?: string;
  end_datetime?: string;
  timezone?: string;
  article_limit?: number;
  ticket_validity_duration?: number;
  practical_info?: string;
  currency?: string;
  status?: "draft" | "published" | "cancelled" | "archived";
  address?: CreateAddressData;
}

// Types pour les activités
export interface Activity {
  id: number;
  event_id: number;
  name: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
  address_id: number | null; // Ajouté pour le lien avec Address
  address?: Address | null; // Ajouté pour le lien avec Address
  effective_address?: Address | null; // Ajouté pour correspondre à la réponse API
  location_type: "general_address" | "specific_location";
  location_id: number | null;
  location_specific_name: string | null;
  status: "active" | "inactive" | "cancelled";
  created_at: string;
  updated_at: string;
  event_name: string;
  event?: Event;
}

export interface CreateActivityData {
  event_id: number;
  name: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  address_id?: number | null; // Ajouté pour le lien avec Address
  address?: CreateAddressData; // Permet la création d'une nouvelle adresse
  location_type: "general_address" | "specific_location";
  location_id?: number;
  location_specific_name?: string;
  status?: "active" | "inactive" | "cancelled";
}

export interface UpdateActivityData {
  name?: string;
  description?: string;
  start_datetime?: string;
  end_datetime?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  address_id?: number | null; // Ajouté pour le lien avec Address
  address?: CreateAddressData; // Permet la création d'une nouvelle adresse
  location_type?: "general_address" | "specific_location";
  location_id?: number;
  location_specific_name?: string;
  status?: "active" | "inactive" | "cancelled";
}

// Types pour les tickets
export interface Ticket {
  id: number;
  event_id: number;
  name: string;
  description: string;
  price: string;
  sales_start_date: string;
  sales_end_date: string;
  status: "active" | "inactive" | "sold_out" | "cancelled";
  created_at: string;
  updated_at: string;
  public_image_id: number | null;
  template_image_id: number | null;
  event_name: string;
  currency: string;
  public_image_url: string | null;
  template_image_url: string | null;
  ticket_count: number;
  quantity_acquired?: number | null; // null = stock illimité
  quantity_sold?: number; // Par défaut 0
  sellable_stock?: number; // Calculé : quantity_acquired - quantity_sold
  event?: Event;
  public_image?: unknown | null;
  template_image?: unknown | null;
  activities?: Activity[];
}

export interface CreateTicketData {
  event_id: number;
  name: string;
  description: string;
  price: string;
  quantity_acquired?: number | null;
  sales_start_date: string;
  sales_end_date: string;
  status?: "active" | "inactive" | "sold_out" | "cancelled";
  public_image_url?: string;
  template_image_url?: string;
  currency?: string;
  ticket_count?: number;
  activity_ids?: number[];
}

export interface UpdateTicketData {
  name?: string;
  description?: string;
  price?: string;
  quantity_acquired?: number | null;
  sales_start_date?: string;
  sales_end_date?: string;
  status?: "active" | "inactive" | "sold_out" | "cancelled";
  public_image_url?: string;
  template_image_url?: string;
  currency?: string;
  ticket_count?: number;
  activity_ids?: number[];
}

// Types pour les produits
export interface Product {
  id: number;
  event_id: number;
  name: string;
  description: string;
  price: string;
  quantity_available: number | null;
  quantity_acquired: number;
  quantity_sold: number;
  quantity_withdrawn: number;
  sellable_stock: number;
  real_stock: number;
  category: string;
  status: "active" | "inactive" | "sold_out" | "cancelled";
  created_at: string;
  updated_at: string;
  currency: string | null;
  main_image_url: string | null;
  event?: EventSummary;
  images: unknown[];
}

export interface CreateProductData {
  event_id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  status?: "active" | "inactive" | "sold_out" | "cancelled";
  main_image_url?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  status?: "active" | "inactive" | "sold_out" | "cancelled";
  main_image_url?: string;
}

// Types pour les commandes
export interface OrderClient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  full_name: string;
}

export interface OrderPayment {
  id: number;
  montant: string;
  currency: string;
  statut: string;
  payment_method: string;
}

export interface OrderEvent {
  event_id: number;
  name: string;
  category: string;
  start_datetime: string;
  end_datetime: string;
  main_image_url: string | null;
  main_image: unknown | null;
}

export interface OrderTicket {
  id: number;
  name: string;
  description: string;
  price: string;
  event_id: number;
  currency: string | null;
  public_image_url: string | null;
  template_image_url: string | null;
  event: OrderEvent;
  public_image: unknown | null;
  template_image: unknown | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  item_name: string;
  price: string;
  quantity: number;
  amount: string;
  ticket_id: number | null;
  product_id: number | null;
  ticket: OrderTicket | null;
  product: unknown | null;
}

export interface OrderedTicket {
  id: number;
  order_id: number;
  number: string;
  statut: string;
  url_ticket: string;
}

export interface OrderedParking {
  id: number;
  order_id: number;
  number: string;
  status: string;
  url_parking: string;
  license_plate: string | null;
  parking_id: number;
  url_parking_download: string;
}

export interface Order {
  id: number;
  number: string;
  date_withdraw: string | null;
  status_withdraw: string | null;
  order_status: string;
  amount: string;
  payment_id: number;
  source: string;
  physical_point_id: number | null;
  client_id: number;
  created_at: string;
  updated_at: string;
  client: OrderClient;
  payment: OrderPayment;
  order_items: OrderItem[];
  ordered_tickets: OrderedTicket[];
  ordered_parkings?: OrderedParking[];
}

// Types pour les parkings
export interface Parking {
  id: number;
  event_id: number;
  name: string;
  description: string | null;
  address_id: number | null;
  total_spaces: number;
  quantity_available?: number | null; // Déprécié - utiliser quantity_acquired, quantity_sold, sellable_stock
  quantity_acquired?: number | null; // null = stock illimité
  quantity_sold?: number; // Par défaut 0
  sellable_stock?: number; // Calculé : quantity_acquired - quantity_sold
  default_price: number;
  currency: string;
  parking_type: string;
  is_available_for_direct_sale: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  event_name?: string;
  organizer_name?: string;
  parking_type_name?: string;
  available_spaces?: number; // Déprécié - utiliser sellable_stock
  event?: Event;
  address?: Address;
}

export interface CreateParkingData {
  event_id: number;
  name: string;
  description?: string;
  default_price: number;
  currency?: string;
  parking_type: string;
  is_available_for_direct_sale: boolean;
  status?: string;
  address: {
    name: string;
    description: string;
    city: string;
    country?: string;
    maps_link?: string;
  };
}

// Types pour les types de parking
export interface ParkingType {
  id: number;
  organizer_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  organizer_name?: string;
  organizer?: Organization;
}

// Types pour les règles d'attribution de parking
export interface ParkingRule {
  id: number;
  event_id: number;
  name: string;
  user_description: string | null;
  threshold: number;
  application_mode: "once_if_threshold" | "per_threshold";
  access_mode: "free" | "discount" | "paid_option";
  price_per_space: number | null;
  max_spaces_per_application: number;
  requires_license_plate: boolean;
  send_parking_pass: boolean;
  valid_from: string | null;
  valid_to: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  event_name?: string;
  organizer_name?: string;
  is_currently_valid?: boolean;
  parkings?: Parking[];
  tickets?: Ticket[];
}

export interface CreateParkingRuleData {
  event_id: number;
  name: string;
  user_description?: string;
  threshold: number;
  application_mode: "once_if_threshold" | "per_threshold";
  access_mode: "free" | "discount" | "paid_option";
  price_per_space?: number | null;
  max_spaces_per_application: number;
  requires_license_plate: boolean;
  send_parking_pass: boolean;
  valid_from?: string;
  valid_to?: string;
  is_visible: boolean;
  parking_ids: number[];
  ticket_ids: number[];
}

export interface UpdateParkingRuleData {
  name?: string;
  user_description?: string;
  threshold?: number;
  application_mode?: "once_if_threshold" | "per_threshold";
  access_mode?: "free" | "discount" | "paid_option";
  price_per_space?: number | null;
  max_spaces_per_application?: number;
  requires_license_plate?: boolean;
  send_parking_pass?: boolean;
  valid_from?: string;
  valid_to?: string;
  is_visible?: boolean;
  parking_ids?: number[];
  ticket_ids?: number[];
}

// Types pour les points physiques
export interface PhysicalPoint {
  id: number;
  name: string;
  organizer_id: number | null;
  address_id: number;
  types: string[];
  created_at: string;
  updated_at: string;
  organizer_name: string | null;
  address_info: {
    name: string;
    description: string | null;
    city: string;
    country: string;
    maps_link: string | null;
  };
  types_labels: string[];
  organizer: Organization | null;
  address: Address;
  hours: PhysicalPointHour[];
}

export interface PhysicalPointHour {
  id: number;
  point_id: number;
  day_of_week: string;
  opening_time: string;
  closing_time: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePhysicalPointData {
  name: string;
  organizer_id?: number;
  address: {
    name: string;
    description?: string;
    city: string;
    country: string;
    maps_link?: string;
  };
  types: string[];
  hours: {
    day_of_week: string;
    opening_time: string;
    closing_time: string;
  }[];
}

export interface UpdatePhysicalPointData {
  name?: string;
  organizer_id?: number;
  address?: {
    name: string;
    description?: string;
    city: string;
    country: string;
    maps_link?: string;
  };
  types?: string[];
  hours?: {
    day_of_week: string;
    opening_time: string;
    closing_time: string;
  }[];
}

// Types pour les demandes d'événements
export interface EventRequest {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  event_name: string;
  start_datetime: string;
  end_datetime: string;
  description: string;
  status: "new" | "in_review" | "processed" | "rejected";
  organizer_id: number | null;
  handled_by_user_id: number | null;
  support_notified_at: string;
  ack_sent_at: string;
  created_at: string;
  updated_at: string;
  organizer: Organization | null;
  handled_by: User | null;
}

// Types pour la pagination Laravel
export interface PaginationLinks {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLinks[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

// Types pour les règles d'attribution ticket-produit
export interface ProductAttribution {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  currency: string | null;
  pivot: {
    quantity: number;
    attribution_type: "free" | "discount" | "paid_option";
    discounted_price: number | null;
  };
}

export interface ProductTicketAttributionRule {
  id: number;
  event_id: number;
  name: string;
  description: string | null;
  threshold: number;
  application_mode: "many_times" | "one_time";
  valid_from: string | null;
  valid_to: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  tickets?: Ticket[];
  products?: ProductAttribution[];
}

export interface CreateAttributionRuleData {
  event_id: number;
  name: string;
  description?: string;
  threshold: number;
  application_mode: "many_times" | "one_time";
  valid_from?: string;
  valid_to?: string;
  is_visible?: boolean;
  ticket_ids: number[];
  products: Array<{
    product_id: number;
    quantity: number;
    attribution_type: "free" | "discount" | "paid_option";
    discounted_price?: number;
  }>;
}

export interface UpdateAttributionRuleData {
  name?: string;
  description?: string;
  threshold?: number;
  application_mode?: "many_times" | "one_time";
  valid_from?: string;
  valid_to?: string;
  is_visible?: boolean;
  ticket_ids?: number[];
  products?: Array<{
    product_id: number;
    quantity: number;
    attribution_type: "free" | "discount" | "paid_option";
    discounted_price?: number;
  }>;
}

// Types pour les règles Parking-Ticket
export interface ParkingTicketRule {
  id: number;
  event_id: number;
  name: string;
  user_description: string | null;
  threshold: number;
  application_mode: "per_threshold" | "once_if_threshold";
  access_mode: "free" | "discount" | "paid_option";
  price_per_space: number | null;
  max_spaces_per_application: number;
  requires_license_plate: boolean;
  send_parking_pass: boolean;
  valid_from: string | null;
  valid_to: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  event_name?: string;
  organizer_name?: string;
  is_currently_valid?: boolean;
  parkings?: Parking[];
  tickets?: Ticket[];
}

export interface CreateParkingTicketRuleData {
  event_id: number;
  name: string;
  user_description?: string;
  threshold: number;
  application_mode: "per_threshold" | "once_if_threshold";
  access_mode: "free" | "discount" | "paid_option";
  price_per_space?: number;
  max_spaces_per_application: number;
  requires_license_plate: boolean;
  send_parking_pass: boolean;
  valid_from?: string;
  valid_to?: string;
  is_visible?: boolean;
  parking_ids: number[];
  ticket_ids: number[];
}

export interface UpdateParkingTicketRuleData {
  name?: string;
  user_description?: string;
  threshold?: number;
  application_mode?: "per_threshold" | "once_if_threshold";
  access_mode?: "free" | "discount" | "paid_option";
  price_per_space?: number;
  max_spaces_per_application?: number;
  requires_license_plate?: boolean;
  send_parking_pass?: boolean;
  valid_from?: string;
  valid_to?: string;
  is_visible?: boolean;
  parking_ids?: number[];
  ticket_ids?: number[];
}
