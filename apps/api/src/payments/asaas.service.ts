import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { CreateChargeDto } from './create-charge.dto';

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly client;

  constructor(private config: ConfigService) {
    const baseURL =
      this.config.get<string>('ASAAS_BASE_URL') ||
      'https://www.asaas.com/api/v3';
    const token = this.config.get<string>('ASAAS_API_KEY') || '';
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        // Asaas aceita o token via header 'access_token' ou query param; aqui usamos header
        access_token: token,
      },
    });
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
      this.logger.error(
        'Erro ao criar cobrança Asaas',
        err?.response?.data || err.message,
      );
      throw err;
    }
  }

  // Handler básico de webhook: apenas loga o evento e retorna dados.
  // Integre com o banco para atualizar assinaturas/usuários.
  handleWebhook(event: any) {
    this.logger.log('Recebido webhook Asaas: ' + JSON.stringify(event));
    // TODO: atualizar modelos/assinaturas no DB
    return { ok: true };
  }
}
