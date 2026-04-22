import raw from "./citiesByCountry.json";

type CitiesFile = {
  description?: string;
  citiesByCountry: Record<string, string[]>;
};

const file = raw as CitiesFile;

/** Villes par pays (clés = nom affiché du pays dans CountrySelect, ex. « Bénin »). */
export const CITIES_BY_COUNTRY: Record<string, string[]> = file.citiesByCountry;

/** Liste des villes pour un pays ; tableau vide si le pays n’a pas de liste définie. */
export function getCitiesForCountry(countryName: string): string[] {
  if (!countryName.trim()) return [];
  return CITIES_BY_COUNTRY[countryName] ?? [];
}
