import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';
import { ROLES_KEY } from './roles.decorator';

/**
 * Guard sprawdzający czy użytkownik ma wymaganą rolę do dostępu do endpointu.
 * Działa w połączeniu z dekoratorem @Roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  /**
   * Sprawdza czy użytkownik ma jedną z wymaganych ról.
   * @param context - Kontekst wykonania żądania
   * @returns true jeśli użytkownik ma wymaganą rolę, false w przeciwnym razie
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || typeof user.role !== 'string') {
      return false;
    }
    return requiredRoles.includes(user.role as Role);
  }
}
