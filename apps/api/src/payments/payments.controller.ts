import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
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
    const token = headers['asaas-access-token'] ?? headers['x-webhook-token'];
    if (!this.asaas.isValidWebhookToken(Array.isArray(token) ? token[0] : token)) {
      throw new UnauthorizedException('Token de webhook inválido.');
    }
    this.asaas.logWebhook(body);
    await this.subs.handleAsaasWebhook(body);
    return { ok: true };
  }
}
