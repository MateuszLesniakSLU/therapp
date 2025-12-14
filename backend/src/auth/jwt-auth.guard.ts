import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest(err: unknown, user: any, info: any, context: ExecutionContext) {
    if (err) {
      console.error('JWT ERR', err);
      throw err;
    }
    if (!user) {
      console.warn('JWT INFO:', info);
      throw new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
