import { SetMetadata } from '@nestjs/common';
import { Role } from './role.enum';

/**
 * Klucz metadanych używany do przechowywania wymaganych ról.
 */
export const ROLES_KEY = 'roles';

/**
 * Dekorator do określania wymaganych ról dla endpointów.
 * @param roles - Lista ról z enuma Role, które mają dostęp do endpointu
 * @example @Roles(Role.ADMIN, Role.THERAPIST)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
