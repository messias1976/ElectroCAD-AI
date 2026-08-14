import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, plan: string, provider = 'ASAAS') {
    return this.prisma.subscription.create({
      data: { userId, plan, provider, providerId: '', status: 'PENDING' },
    });
  }

  async findById(id: string) {
    return this.prisma.subscription.findUnique({ where: { id } });
  }

  async updateProviderIdById(id: string, providerId: string) {
    return this.prisma.subscription.update({ where: { id }, data: { providerId } });
  }

  private getTrial(user: any) {
    const start = new Date(user.trialStartedAt ?? user.createdAt);
    const trialDays = Number(user.trialDays ?? 14);
    const end = new Date(start.getTime() + trialDays * 86400000);
    const now = new Date();
    const remaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
    const expired = now >= end;
    return { trialDays, trialStartedAt: start, trialEndsAt: end, daysRemaining: remaining, expired };
  }

  async getMyAccess(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!user) return null;
    const subscription = user.subscriptions[0] ?? null;
    const active = subscription?.status === 'ACTIVE';
    const trial = this.getTrial(user);
    return {
      userId: user.id,
      plan: subscription?.plan ?? 'Teste gratuito',
      subscriptionStatus: subscription?.status ?? 'TRIAL',
      hasActiveSubscription: active,
      ...trial,
      accessAllowed: active || !trial.expired,
      requiresSubscription: !active && trial.expired,
    };
  }

  async getAdminOverview() {
    const users = await this.prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      orderBy: { createdAt: 'desc' },
      include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    return users.map((user) => {
      const trial = this.getTrial(user);
      const subscription = user.subscriptions[0] ?? null;
      const active = subscription?.status === 'ACTIVE';
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        plan: subscription?.plan ?? 'Teste gratuito',
        subscriptionStatus: subscription?.status ?? 'TRIAL',
        hasActiveSubscription: active,
        ...trial,
        accessAllowed: active || !trial.expired,
        requiresSubscription: !active && trial.expired,
      };
    });
  }

  async handleAsaasWebhook(event: any) {
    try {
      const data = event?.data || event;
      const paymentId = data?.id || data?.paymentId || data?.payment?.id;
      const status = (data?.status || data?.payment?.status || '').toUpperCase();
      if (!paymentId) {
        this.logger.warn('Webhook Asaas sem paymentId');
        return { ok: false };
      }
      const sub = await this.prisma.subscription.findFirst({ where: { providerId: paymentId } });
      if (!sub) return { ok: true };
      let newStatus = sub.status;
      if (status.includes('CONFIRMED') || status.includes('RECEIVED') || status.includes('PAID')) newStatus = 'ACTIVE';
      else if (status.includes('CANCELLED') || status.includes('OVERDUE') || status.includes('REFUNDED')) newStatus = 'CANCELLED';
      await this.prisma.subscription.update({ where: { id: sub.id }, data: { status: newStatus } });
      return { ok: true };
    } catch (err: any) {
      this.logger.error('Erro ao processar webhook Asaas', err?.message || err);
      return { ok: false };
    }
  }
}
