/**
 * Utilitaires pour la gestion des identifiants d'événements (slug ou ID)
 */

/**
 * Vérifie si un identifiant est un ID numérique
 * @param identifier - L'identifiant à vérifier
 * @returns true si c'est un ID numérique
 */
export function isNumericId(identifier: string): boolean {
  return /^\d+$/.test(identifier);
}

/**
 * Extrait l'identifiant principal d'un événement (slug en priorité, sinon ID)
 * @param event - L'événement
 * @returns L'identifiant principal (slug en priorité, sinon ID)
 */
export function getEventIdentifier(event: {
  slug?: string;
  event_id: number;
}): string {
  return event.slug || event.event_id.toString();
}

/**
 * Génère l'URL d'un événement avec son slug
 * @param event - L'événement
 * @param basePath - Le chemin de base (ex: "/evenement")
 * @returns L'URL complète avec le slug
 */
export function getEventUrl(
  event: { slug?: string; event_id: number },
  basePath: string = "/evenement"
): string {
  const identifier = getEventIdentifier(event);
  return `${basePath}/${identifier}`;
}

/**
 * Génère l'URL de gestion d'un événement avec son slug
 * @param event - L'événement
 * @param subPath - Le sous-chemin (ex: "activites", "tickets")
 * @returns L'URL complète de gestion
 */
export function getEventManagementUrl(
  event: { slug?: string; event_id: number },
  subPath: string
): string {
  const identifier = getEventIdentifier(event);
  return `/gestion-evenement/${identifier}/${subPath}`;
}
