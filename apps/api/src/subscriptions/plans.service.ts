import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_PLANS = [
  {
    name: 'Starter',
    price: 'R$ 49',
    trialDays: 14,
    description: 'Ideal para começar e organizar seus projetos elétricos com os recursos essenciais.',
    features: ['Projetos', 'Clientes', 'Planta 2D', 'Recursos básicos de IA'],
  },
  {
    name: 'Pro',
    price: 'R$ 129',
    trialDays: 30,
    description: 'Para profissionais que precisam de mais produtividade e recursos avançados.',
    features: ['Tudo do Starter', 'Projetista elétrico', 'Professor IA', 'Relatórios avançados'],
  },
  {
    name: 'Enterprise',
    price: 'R$ 299',
    trialDays: 45,
    description: 'Para profissionais e empresas que precisam de maior capacidade e recursos completos.',
    features: ['Tudo do Pro', 'Maior capacidade', 'Recursos premium disponíveis', 'Suporte diferenciado'],
  },
];

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    let plans = await this.prisma.plan.findMany({ orderBy: { createdAt: 'asc' } });
    if (plans.length === 0) {
      await this.prisma.plan.createMany({ data: DEFAULT_PLANS });
      plans = await this.prisma.plan.findMany({ orderBy: { createdAt: 'asc' } });
    }
    return plans;
  }

  async replace(plans: Array<{ id?: string; name: string; price: string; trialDays: number; description: string; features: string[] }>) {
    const normalized = plans.map((plan) => ({
      id: plan.id || undefined,
      name: plan.name.trim(),
      price: plan.price.trim(),
      trialDays: Math.max(0, Number(plan.trialDays) || 0),
      description: plan.description.trim(),
      features: Array.isArray(plan.features) ? plan.features.filter(Boolean) : [],
    }));

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.plan.findMany();
      const incomingIds = new Set<string>();
      for (const plan of normalized) {
        if (plan.id) incomingIds.add(plan.id);
      }

      for (const plan of existing) {
        if (!incomingIds.has(plan.id)) {
          await tx.plan.delete({ where: { id: plan.id } });
        }
      }

      const saved: Array<(typeof existing)[number]> = [];
      for (const plan of normalized) {
        const data = {
          name: plan.name,
          price: plan.price,
          trialDays: plan.trialDays,
          description: plan.description,
          features: plan.features,
        };
        if (plan.id) {
          saved.push(await tx.plan.update({ where: { id: plan.id }, data }));
        } else {
          saved.push(await tx.plan.create({ data }));
        }
      }
      return saved;
    });
  }
}
