export class CreateSubscriptionDto {
  userId: string;
  plan: string;
  provider?: string; // e.g. 'ASAAS'
  billingType?: string; // e.g. 'BOLETO'
  dueDate?: string; // YYYY-MM-DD
  value?: number;
}
