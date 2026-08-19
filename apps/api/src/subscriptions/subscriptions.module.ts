import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AsaasService } from '../payments/asaas.service';
import { ConfigModule } from '@nestjs/config';
import { AdminGuard } from '../auth/guards/roles.guard';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [ConfigModule],
  controllers: [SubscriptionsController, PlansController],
  providers: [SubscriptionsService, PlansService, PrismaService, AsaasService, AdminGuard],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
