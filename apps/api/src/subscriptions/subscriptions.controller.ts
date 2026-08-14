import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';
import { AsaasService } from '../payments/asaas.service';
import { AdminGuard } from '../auth/guards/roles.guard';

@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionsController {
  constructor(private subs: SubscriptionsService, private asaas: AsaasService) {}

  @Get('me')
  async me(@Req() req: any) {
    return this.subs.getMyAccess(req.user.id);
  }

  @UseGuards(AdminGuard)
  @Get('admin/overview')
  async adminOverview() {
    return this.subs.getAdminOverview();
  }

  @UseGuards(AdminGuard)
  @Post()
  async create(@Body() dto: CreateSubscriptionDto) {
    const provider = dto.provider || 'ASAAS';
    const sub = await this.subs.create(dto.userId, dto.plan, provider);
    if (provider === 'ASAAS' && dto.value) {
      const charge = await this.asaas.createCharge({
        customerId: dto.userId,
        billingType: dto.billingType || 'BOLETO',
        dueDate: dto.dueDate || new Date().toISOString().slice(0, 10),
        value: dto.value,
        description: `Assinatura ${dto.plan}`,
      });
      const pid = charge?.id || charge?.paymentId || charge?.billingId || '';
      if (pid) await this.subs.updateProviderIdById(sub.id, pid);
      return { subscription: sub, charge };
    }
    return { subscription: sub };
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.subs.findById(id);
  }
}
