import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_PLANS = [
  {
    name: 'Starter',
    price: 'R$ 49',
    trialDays: 14,
    description:
      'Ideal para começar com automação leve, IA prática e gestão simples no dia a dia.',
    features: [
      '1 projeto ativo',
      'IA básica',
      'Assistente inteligente',
      'Relatórios básicos',
    ],
  },
  {
    name: 'Pro',
    price: 'R$ 129',
    trialDays: 30,
    description:
      'Para empresas que querem mais automação, IA avançada e produtividade em escala.',
    features: [
      '10 projetos ativos',
      'IA avançada',
      'Automações inteligentes',
      'Dashboards avançados',
    ],
  },
  {
    name: 'Enterprise',
    price: 'R$ 299',
    trialDays: 45,
    description:
      'Para operações maiores com equipe, IA premium e suporte dedicado.',
    features: [
      'Projetos ilimitados',
      'IA premium e automações',
      'Suporte dedicado',
      'Gestão comercial completa',
    ],
  },
];

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    let plans = await this.prisma.plan.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (plans.length === 0) {
      await this.prisma.plan.createMany({
        data: DEFAULT_PLANS,
      });

      plans = await this.prisma.plan.findMany({
        orderBy: {
          createdAt: 'asc',
        },
      });
    }

    return plans;
  }

  async replace(
    plans: Array<{
      id?: string;
      name: string;
      price: string;
      trialDays: number;
      description: string;
      features: string[];
    }>,
  ) {
    const normalized = plans.map((plan) => ({
      id: plan.id,
      name: plan.name.trim(),
      price: plan.price.trim(),
      trialDays: Math.max(0, Number(plan.trialDays) || 0),
      description: plan.description.trim(),
      features: Array.isArray(plan.features)
        ? plan.features.filter((feature) => Boolean(feature))
        : [],
    }));

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.plan.findMany();

      const incomingIds = new Set<string>();

      for (const plan of normalized) {
        if (plan.id) {
          incomingIds.add(plan.id);
        }
      }

      for (const plan of existing) {
        if (!incomingIds.has(plan.id)) {
          await tx.plan.delete({
            where: {
              id: plan.id,
            },
          });
        }
      }

      const saved: Array<(typeof existing)[number]> = [];

      for (const plan of normalized) {
        if (plan.id) {
          const updated = await tx.plan.update({
            where: {
              id: plan.id,
            },
            data: {
              name: plan.name,
              price: plan.price,
              trialDays: plan.trialDays,
              description: plan.description,
              features: plan.features,
            },
          });

          saved.push(updated);
        } else {
          const created = await tx.plan.create({
            data: {
              name: plan.name,
              price: plan.price,
              trialDays: plan.trialDays,
              description: plan.description,
              features: plan.features,
            },
          });

          saved.push(created);
        }
      }

      return saved;
    });
  }
}