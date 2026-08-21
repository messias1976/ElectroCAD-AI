import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { CreateChargeDto } from './create-charge.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private asaas: AsaasService,
    private subs: SubscriptionsService,
  ) {}

  @Post('charge')
  async createCharge(@Body() dto: CreateChargeDto) {
    return await this.asaas.createCharge(dto);
  }

  @Post('webhook')
  async webhook(@Body() body: any, @Headers() headers: any) {
    // Checagem simples de segredo se configurado
    const secret = process.env.ASAAS_WEBHOOK_SECRET;
    const incoming =
      headers['x-asaas-signature'] ||
      headers['x-asaas-signature'.toLowerCase()];
    if (secret && incoming && incoming !== secret) {
      return { ok: false };
    }
    // Delegar processamento para SubscriptionsService
    await this.subs.handleAsaasWebhook(body);
    return { ok: true };
  }
}
