export class CreateChargeDto {
  // ID do cliente no Asaas (ou no seu sistema)
  customerId: string;
  // Tipo de cobrança: "BOLETO", "CREDIT_CARD", etc.
  billingType: string;
  // Data de vencimento no formato YYYY-MM-DD
  dueDate: string;
  // Valor a cobrar
  value: number;
  // Descrição da cobrança
  description?: string;
}
