import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

export const ADMIN_ROLE = 'ADMIN';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request.user?.role !== ADMIN_ROLE) {
      throw new ForbiddenException('Acesso exclusivo do administrador do SaaS.');
    }
    return true;
  }
}
