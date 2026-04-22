import type { RoleDefinition } from './types';

// Définitions des rôles système
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    name: 'super_admin',
    label: 'Super Administrateur',
    description: 'Accès complet à toute la plateforme',
    isGlobal: true,
    requiresOrganization: false,
  },
  {
    name: 'admin',
    label: 'Administrateur',
    description: 'Administration globale de la plateforme',
    isGlobal: true,
    requiresOrganization: false,
  },
  {
    name: 'staff',
    label: 'Personnel',
    description: 'Accès limité aux fonctions de base',
    isGlobal: true,
    requiresOrganization: false,
  },
  {
    name: 'organizer_owner',
    label: 'Propriétaire Organisation',
    description: 'Propriétaire d\'une organisation spécifique',
    isGlobal: false,
    requiresOrganization: true,
  },
  {
    name: 'organizer_admin',
    label: 'Admin Organisation',
    description: 'Administrateur d\'une organisation spécifique',
    isGlobal: false,
    requiresOrganization: true,
  },
  {
    name: 'organizer_staff',
    label: 'Staff Organisation',
    description: 'Personnel d\'une organisation spécifique',
    isGlobal: false,
    requiresOrganization: true,
  },
];

// Rôles globaux (ne nécessitent pas d'organisation)
export const GLOBAL_ROLES = ROLE_DEFINITIONS.filter(role => role.isGlobal);

// Rôles d'organisation (nécessitent une organisation)
export const ORGANIZATION_ROLES = ROLE_DEFINITIONS.filter(role => !role.isGlobal);

// Helper pour obtenir la définition d'un rôle
export const getRoleDefinition = (roleName: string): RoleDefinition | undefined => {
  return ROLE_DEFINITIONS.find(role => role.name === roleName);
};
