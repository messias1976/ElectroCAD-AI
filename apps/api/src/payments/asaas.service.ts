import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { CreateChargeDto } from './create-charge.dto';

export type AsaasBillingType = 'UNDEFINED' | 'BOLETO' | 'PIX' | 'CREDIT_CARD';
export type AsaasCycle = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly client;

  constructor(private config: ConfigService) {
    const baseURL = this.config.get<string>('ASAAS_BASE_URL') || 'https://api.asaas.com/v3';
    const token = this.config.get<string>('ASAAS_API_KEY') || '';
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        access_token: token,
      },
      timeout: 15000,
    });
  }

  async createCustomer(input: { name: string; email?: string | null; externalReference: string }) {
    const res = await this.client.post('/customers', {
      name: input.name,
      email: input.email || undefined,
      externalReference: input.externalReference,
    });
    return res.data;
  }

  async createSubscription(input: {
    customerId: string;
    billingType: AsaasBillingType;
    value: number;
    nextDueDate: string;
    cycle: AsaasCycle;
    description: string;
    externalReference: string;
  }) {
    try {
      const res = await this.client.post('/subscriptions', input);
      return res.data;
    } catch (err: any) {
      this.logger.error('Erro ao criar assinatura Asaas', err?.response?.data || err.message);
      throw err;
    }
  }

  async getSubscription(id: string) {
    const res = await this.client.get(`/subscriptions/${encodeURIComponent(id)}`);
    return res.data;
  }

  async updateSubscription(id: string, data: Record<string, unknown>) {
    const res = await this.client.put(`/subscriptions/${encodeURIComponent(id)}`, data);
    return res.data;
  }

  async deleteSubscription(id: string) {
    const res = await this.client.delete(`/subscriptions/${encodeURIComponent(id)}`);
    return res.data;
  }

  async createCharge(dto: CreateChargeDto) {
    try {
      const body = {
        customer: dto.customerId,
        billingType: dto.billingType,
        dueDate: dto.dueDate,
        value: dto.value,
        description: dto.description,
      };
      const res = await this.client.post('/payments', body);
      return res.data;
    } catch (err: any) {
      this.logger.error('Erro ao criar cobrança Asaas', err?.response?.data || err.message);
      throw err;
    }
  }
}
