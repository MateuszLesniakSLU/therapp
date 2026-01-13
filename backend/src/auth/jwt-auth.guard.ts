import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Guard JWT - sprawdza czy żądanie posiada prawidłowy token JWT.
 * Można pominąć autoryzację dla publicznych endpointów za pomocą dekoratora @Public().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Sprawdza czy endpoint jest publiczny lub wymaga autoryzacji JWT.
   */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  /**
   * Obsługuje wynik autoryzacji JWT.
   * @throws UnauthorizedException jeśli token jest nieprawidłowy lub wygasł
   */
  handleRequest(err: unknown, user: any, info: any, context: ExecutionContext) {
    if (err) {
      throw err;
    }
    if (!user) {
      throw new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
