import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_PLANS = [
  { id: 'starter', name: 'Starter', price: 'R$ 49', trialDays: 14, description: 'Ideal para começar a organizar projetos, clientes e a rotina técnica.', features: ['1 projeto ativo', 'Clientes', 'Planta 2D', 'Recursos básicos de IA'] },
  { id: 'pro', name: 'Pro', price: 'R$ 129', trialDays: 30, description: 'Para profissionais que precisam de mais capacidade e recursos técnicos.', features: ['10 projetos ativos', 'Projetista elétrico', 'Professor IA', 'Recursos avançados de IA'] },
  { id: 'enterprise', name: 'Enterprise', price: 'R$ 299', trialDays: 0, description: 'Para operações maiores com equipe, recursos completos e suporte dedicado.', features: ['Projetos ilimitados', 'Planta 2D', 'Projetista elétrico', 'Professor IA', 'Suporte dedicado'] },
];

@Controller('plans')
export class PlansController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    let plans = await this.prisma.plan.findMany({ orderBy: { id: 'asc' } });
    if (plans.length === 0) {
      await this.prisma.plan.createMany({ data: DEFAULT_PLANS });
      plans = await this.prisma.plan.findMany({ orderBy: { id: 'asc' } });
    }
    return plans;
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Put()
  async update(@Body() body: any) {
    if (!Array.isArray(body?.plans)) return { ok: false, message: 'Lista de planos inválida.' };

    const plans = body.plans.map((plan: any, index: number) => ({
      id: String(plan.id || DEFAULT_PLANS[index]?.id || `plan-${index + 1}`),
      name: String(plan.name || 'Plano'),
      price: String(plan.price || 'R$ 0'),
      trialDays: Math.max(0, Number(plan.trialDays) || 0),
      description: String(plan.description || ''),
      features: Array.isArray(plan.features) ? plan.features.map((feature: any) => String(feature)) : [],
    }));

    for (const plan of plans) {
      await this.prisma.plan.upsert({
        where: { id: plan.id },
        create: plan,
        update: plan,
      });
    }

    return { ok: true, plans: await this.prisma.plan.findMany({ orderBy: { id: 'asc' } }) };
  }
}
