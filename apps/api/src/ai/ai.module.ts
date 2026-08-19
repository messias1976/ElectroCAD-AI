import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AdminGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SubscriberAccessGuard } from '../subscriptions/guards/subscriber-access.guard';

@Module({
  imports: [SubscriptionsModule],
  controllers: [AiController],
  providers: [AiService, AdminGuard, PrismaService, SubscriberAccessGuard],
})
export class AiModule {}
