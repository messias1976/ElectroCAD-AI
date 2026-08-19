import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class SubscriberAccessGuard implements CanActivate {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user?: { userId: string; role: string } }>();
    if (request.user?.role === 'ADMIN') return true;
    if (!request.user) throw new ForbiddenException('Usuário não autenticado.');
    const access = await this.subscriptions.getMyAccess(request.user.userId);
    if (!access?.accessAllowed) throw new ForbiddenException('Seu teste terminou, a assinatura não está ativa ou o acesso foi suspenso.');
    return true;
  }
}
