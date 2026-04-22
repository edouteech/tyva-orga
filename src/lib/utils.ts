// Utilitaires généraux

// Fonction pour formater les noms d'utilisateur
export const formatUserName = (firstName?: string, lastName?: string, email?: string): string => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  return email || 'Utilisateur';
};

// Fonction pour obtenir les initiales
export const getUserInitials = (firstName?: string, lastName?: string, email?: string): string => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return 'U';
};

// Fonction pour valider l'email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Fonction pour formater les prix de manière sécurisée
export const formatPrice = (price: string | number, currency?: string | null): string => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Si la devise n'est pas définie, utiliser le FCFA par défaut
  if (!currency) {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice) + " FCFA";
  }
  
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(numericPrice);
  } catch {
    // En cas d'erreur avec la devise, afficher le prix avec le FCFA par défaut
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice) + " FCFA";
  }
};

type BackendDateParts = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
};

const parseBackendDateParts = (value: string): BackendDateParts | null => {
  const normalized = value.trim().replace(" ", "T");
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2})(?::(\d{2}))?(?::(\d{2}))?)?/
  );

  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: match[4] ? Number(match[4]) : 0,
    minute: match[5] ? Number(match[5]) : 0,
    second: match[6] ? Number(match[6]) : 0,
  };
};

const toNoTimezoneDate = (value: string): Date => {
  const parts = parseBackendDateParts(value);
  if (!parts) return new Date(value);

  // On injecte les composantes telles quelles pour éviter toute conversion UTC -> locale.
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0
  );
};

export const formatBackendDate = (
  value?: string | null,
  locale: string = "fr-FR",
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!value) return "";
  return toNoTimezoneDate(value).toLocaleDateString(locale, options);
};

export const formatBackendTime = (
  value?: string | null,
  locale: string = "fr-FR",
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!value) return "";
  return toNoTimezoneDate(value).toLocaleTimeString(locale, options);
};
