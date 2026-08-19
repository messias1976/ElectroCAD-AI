import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CreateChargeDto } from './create-charge.dto';

type AsaasCustomer = { id: string };
type AsaasSubscription = { id: string };

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly client: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.client = axios.create({
      baseURL: this.config.get<string>('ASAAS_BASE_URL') || 'https://www.asaas.com/api/v3',
      headers: { 'Content-Type': 'application/json', access_token: this.config.get<string>('ASAAS_API_KEY') || '' },
    });
  }

  async createCharge(dto: CreateChargeDto) {
    const response = await this.client.post('/payments', { customer: dto.customerId, billingType: dto.billingType, dueDate: dto.dueDate, value: dto.value, description: dto.description });
    return response.data as { id?: string };
  }

  async createCustomer(name: string, email: string) {
    const response = await this.client.post<AsaasCustomer>('/customers', { name, email });
    return response.data;
  }

  async createSubscription(customerId: string, billingType: string, value: number, description: string) {
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const response = await this.client.post<AsaasSubscription>('/subscriptions', { customer: customerId, billingType, value, nextDueDate: nextDueDate.toISOString().slice(0, 10), description });
    return response.data;
  }

  async cancelSubscription(subscriptionId: string) {
    await this.client.delete(`/subscriptions/${subscriptionId}`);
  }

  isValidWebhookToken(token: string | undefined) {
    const expected = this.config.get<string>('ASAAS_WEBHOOK_TOKEN');
    return Boolean(expected && token && token === expected);
  }

  logWebhook(event: unknown) { this.logger.log(`Webhook Asaas recebido: ${JSON.stringify(event)}`); }
}
