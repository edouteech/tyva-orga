export type DeliveryPointStatus = "active" | "disabled";

export interface DeliveryPoint {
  id: number;
  country: string;
  city: string;
  zone: string;
  delivery_price: number;
  status: DeliveryPointStatus;
  created_at: string;
  updated_at: string;
  /** Point physique dont le stock sera déduit (optionnel). */
  physical_point_id?: number | null;
  physical_point_name?: string | null;
}

export interface DeliveryPointFormData {
  country: string;
  city: string;
  zone: string;
  delivery_price: number | string;
  status: DeliveryPointStatus;
  /** Optionnel : lier la zone à un point physique. */
  link_physical_point_id?: number | null;
}

