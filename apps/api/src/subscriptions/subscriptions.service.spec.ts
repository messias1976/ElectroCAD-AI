import { Test, TestingModule } from '@nestjs/testing';
import { AsaasService } from '../payments/asaas.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService pending payment', () => {
  let service: SubscriptionsService;
  const prisma = {
    subscription: {
      findFirst: jest.fn(),
    },
  };
  const asaas = {
    listSubscriptionPayments: jest.fn(),
  };

  beforeEach(async () => {
    prisma.subscription.findFirst.mockReset();
    asaas.listSubscriptionPayments.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AsaasService, useValue: asaas },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('returns the oldest unpaid Asaas charge with its invoice URLs', async () => {
    prisma.subscription.findFirst.mockResolvedValue({ providerId: 'sub_123' });
    asaas.listSubscriptionPayments.mockResolvedValue([
      {
        id: 'pay_paid',
        status: 'RECEIVED',
        dueDate: '2026-11-01',
        value: 129,
        billingType: 'PIX',
      },
      {
        id: 'pay_pending',
        status: 'PENDING',
        dueDate: '2026-11-25',
        value: 129,
        billingType: 'PIX',
        invoiceUrl: 'https://asaas.example/invoice',
        bankSlipUrl: null,
      },
    ]);

    await expect(service.getMyPendingPayment('user_123')).resolves.toEqual({
      id: 'pay_pending',
      status: 'PENDING',
      dueDate: '2026-11-25',
      value: 129,
      billingType: 'PIX',
      invoiceUrl: 'https://asaas.example/invoice',
      bankSlipUrl: null,
    });
    expect(asaas.listSubscriptionPayments).toHaveBeenCalledWith('sub_123');
  });

  it('returns null without querying Asaas when the user has no pending subscription', async () => {
    prisma.subscription.findFirst.mockResolvedValue(null);

    await expect(service.getMyPendingPayment('user_123')).resolves.toBeNull();
    expect(asaas.listSubscriptionPayments).not.toHaveBeenCalled();
  });
});
