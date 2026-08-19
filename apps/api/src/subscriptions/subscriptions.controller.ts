import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/roles.guard';
import { SubscriptionsService } from './subscriptions.service';
import { AsaasService } from '../payments/asaas.service';

@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService, private readonly asaas: AsaasService) {}

  @Get('me')
  me(@Req() req: { user: { userId: string } }) { return this.subs.getMyAccess(req.user.userId); }

  @Post('checkout')
  async checkout(@Req() req: { user: { userId: string } }, @Body() body: { plan?: string; billingType?: string }) {
    const plan = await this.subs.getPlan(body.plan ?? '');
    const user = await this.subs.getUserForCheckout(req.user.userId);
    if (!user.email) throw new BadRequestException('Cadastre um email antes de solicitar uma assinatura.');
    const customerId = user.asaasCustomerId ?? (await this.asaas.createCustomer(user.username, user.email)).id;
    if (!user.asaasCustomerId) await this.subs.saveAsaasCustomerId(user.id, customerId);
    const value = Number(plan.price.replace(/[^0-9,]/g, '').replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) throw new BadRequestException('O valor do plano é inválido.');
    const asaasSubscription = await this.asaas.createSubscription(customerId, body.billingType ?? 'BOLETO', value, `Assinatura ${plan.name}`);
    const subscription = await this.subs.createPendingAsaasSubscription(user.id, plan.name, asaasSubscription.id);
    return { subscription, asaasSubscriptionId: asaasSubscription.id };
  }

  @UseGuards(AdminGuard)
  @Get('admin/overview')
  adminOverview() { return this.subs.getAdminOverview(); }

  @UseGuards(AdminGuard)
  @Get('admin/:userId')
  adminSubscriber(@Param('userId') userId: string) { return this.subs.getAdminSubscriber(userId); }

  @UseGuards(AdminGuard)
  @Post('admin/:userId/trial')
  extendTrial(@Param('userId') userId: string, @Body() body: { days?: number }) { return this.subs.extendTrial(userId, Number(body.days)); }

  @UseGuards(AdminGuard)
  @Put('admin/:userId/plan')
  changePlan(@Param('userId') userId: string, @Body() body: { plan?: string }) { return this.subs.changePlan(userId, body.plan ?? ''); }

  @UseGuards(AdminGuard)
  @Post('admin/:userId/cancel')
  async cancel(@Param('userId') userId: string) {
    const subscriber = await this.subs.getAdminSubscriber(userId);
    if (subscriber.provider === 'ASAAS' && subscriber.asaasSubscriptionId) {
      await this.asaas.cancelSubscription(subscriber.asaasSubscriptionId);
    }
    return this.subs.cancel(userId);
  }

  @UseGuards(AdminGuard)
  @Post('admin/:userId/suspend')
  suspend(@Param('userId') userId: string) { return this.subs.setAccessStatus(userId, 'SUSPENDED'); }

  @UseGuards(AdminGuard)
  @Post('admin/:userId/reactivate')
  reactivate(@Param('userId') userId: string) { return this.subs.setAccessStatus(userId, 'ACTIVE'); }

  @UseGuards(AdminGuard)
  @Delete('admin/:userId')
  delete(@Param('userId') userId: string) { return this.subs.deleteSubscriber(userId); }
}
