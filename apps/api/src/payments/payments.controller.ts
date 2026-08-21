import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AsaasService } from './asaas.service';
import { CreateChargeDto } from './create-charge.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private asaas: AsaasService,
    private subs: SubscriptionsService,
    private config: ConfigService,
  ) {}

  @Post('charge')
  async createCharge(@Body() dto: CreateChargeDto) {
    return this.asaas.createCharge(dto);
  }

  @Post('webhook')
  async webhook(@Body() body: any, @Headers() headers: Record<string, string | undefined>) {
    const secret = this.config.get<string>('ASAAS_WEBHOOK_SECRET');
    const incoming = headers['asaas-access-token'];
    if (secret && incoming !== secret) {
      throw new UnauthorizedException('Webhook Asaas não autorizado.');
    }
    return this.subs.handleAsaasWebhook(body);
  }
}
