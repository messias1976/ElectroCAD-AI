import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Subscription, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getTrial(user: Pick<User, 'trialStartedAt' | 'trialDays' | 'createdAt'>) {
    const start = new Date(user.trialStartedAt ?? user.createdAt);
    const trialDays = Math.max(0, user.trialDays);
    const end = new Date(start.getTime() + trialDays * 86_400_000);
    const now = new Date();
    return { trialDays, trialStartedAt: start, trialEndsAt: end, daysRemaining: Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000)), expired: now >= end };
  }

  private toAccess(user: User, subscription: Subscription | null) {
    const trial = this.getTrial(user);
    const subscriptionActive = subscription?.status === 'ACTIVE' && subscription.paymentStatus === 'PAID';
    const suspended = user.accessStatus === 'SUSPENDED';
    return { userId: user.id, plan: subscription?.plan ?? 'Teste gratuito', subscriptionStatus: subscription?.status ?? 'TRIAL', paymentStatus: subscription?.paymentStatus ?? 'TRIAL', hasActiveSubscription: subscriptionActive, ...trial, accessStatus: user.accessStatus, accessAllowed: !suspended && (subscriptionActive || !trial.expired), requiresSubscription: suspended || (!subscriptionActive && trial.expired) };
  }

  async getMyAccess(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } } });
    if (!user) return null;
    return this.toAccess(user, user.subscriptions[0] ?? null);
  }

  async getAdminOverview() {
    const users = await this.prisma.user.findMany({ where: { role: { not: 'ADMIN' } }, orderBy: { createdAt: 'desc' }, include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } } });
    return users.map((user) => {
      const subscription = user.subscriptions[0] ?? null;
      return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt, provider: subscription?.provider ?? null, asaasSubscriptionId: subscription?.provider === 'ASAAS' ? subscription.providerId : null, asaasPaymentId: subscription?.paymentId ?? null, ...this.toAccess(user, subscription) };
    });
  }

  async getAdminSubscriber(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { subscriptions: { orderBy: { createdAt: 'desc' } } } });
    if (!user || user.role === 'ADMIN') throw new NotFoundException('Assinante não encontrado.');
    const subscription = user.subscriptions[0] ?? null;
    return { id: user.id, username: user.username, email: user.email, subscriptions: user.subscriptions, provider: subscription?.provider ?? null, asaasSubscriptionId: subscription?.provider === 'ASAAS' ? subscription.providerId : null, asaasPaymentId: subscription?.paymentId ?? null, ...this.toAccess(user, subscription) };
  }

  async extendTrial(userId: string, days: number) {
    if (!Number.isInteger(days) || days <= 0) throw new NotFoundException('Informe uma quantidade positiva de dias.');
    const user = await this.prisma.user.update({ where: { id: userId }, data: { trialDays: { increment: days } } });
    return this.getTrial(user);
  }

  async changePlan(userId: string, planName: string) {
    const plan = await this.prisma.plan.findUnique({ where: { name: planName } });
    if (!plan) throw new NotFoundException('Plano não encontrado.');
    const current = await this.prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!current) return this.prisma.subscription.create({ data: { userId, plan: plan.name, provider: 'MANUAL', providerId: '', status: 'PENDING' } });
    return this.prisma.subscription.update({ where: { id: current.id }, data: { plan: plan.name } });
  }

  async setAccessStatus(userId: string, accessStatus: 'ACTIVE' | 'SUSPENDED') {
    return this.prisma.user.update({ where: { id: userId }, data: { accessStatus } });
  }

  async cancel(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!subscription) throw new NotFoundException('Assinatura não encontrada.');
    return this.prisma.subscription.update({ where: { id: subscription.id }, data: { status: 'CANCELLED', paymentStatus: 'CANCELLED' } });
  }

  async deleteSubscriber(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.project.deleteMany({ where: { OR: [{ userId }, { client: { ownerId: userId } }] } });
      await tx.client.deleteMany({ where: { ownerId: userId } });
      await tx.subscription.deleteMany({ where: { userId } });
      return tx.user.delete({ where: { id: userId } });
    });
  }

  async createPendingAsaasSubscription(userId: string, plan: string, providerId: string, paymentId?: string) {
    return this.prisma.subscription.create({ data: { userId, plan, provider: 'ASAAS', providerId, paymentId, status: 'PENDING', paymentStatus: 'PENDING' } });
  }

  async saveAsaasCustomerId(userId: string, asaasCustomerId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { asaasCustomerId } });
  }

  async getUserForCheckout(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async getPlan(planName: string) {
    const plan = await this.prisma.plan.findUnique({ where: { name: planName } });
    if (!plan) throw new NotFoundException('Plano não encontrado.');
    return plan;
  }

  async handleAsaasWebhook(event: unknown) {
    const payload = event as { event?: string; payment?: { id?: string; subscription?: string; status?: string }; data?: { id?: string; subscription?: string; status?: string } };
    const data = payload.payment ?? payload.data ?? {};
    const eventName = (payload.event ?? data.status ?? '').toUpperCase();
    const paymentId = data.id;
    const providerId = data.subscription;
    if (!paymentId && !providerId) { this.logger.warn('Webhook Asaas sem identificador de cobrança ou assinatura.'); return { ok: false }; }
    const subscription = await this.prisma.subscription.findFirst({ where: { OR: [{ paymentId }, { providerId: providerId ?? paymentId ?? '' }] } });
    if (!subscription) return { ok: true };
    const paid = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_RECEIVED_IN_CASH', 'RECEIVED', 'CONFIRMED'].includes(eventName);
    const cancelled = ['PAYMENT_OVERDUE', 'PAYMENT_REFUNDED', 'PAYMENT_DELETED', 'SUBSCRIPTION_DELETED', 'CANCELLED', 'OVERDUE', 'REFUNDED'].includes(eventName);
    return this.prisma.subscription.update({ where: { id: subscription.id }, data: { paymentId: paymentId ?? subscription.paymentId, status: paid ? 'ACTIVE' : cancelled ? 'CANCELLED' : subscription.status, paymentStatus: paid ? 'PAID' : cancelled ? (eventName.includes('OVERDUE') ? 'OVERDUE' : 'CANCELLED') : 'PENDING' } });
  }
}
