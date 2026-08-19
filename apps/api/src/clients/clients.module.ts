import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SubscriberAccessGuard } from '../subscriptions/guards/subscriber-access.guard';

@Module({
  imports: [SubscriptionsModule],
  controllers: [ClientsController],
  providers: [ClientsService, PrismaService, SubscriberAccessGuard],
  exports: [ClientsService],
})
export class ClientsModule {}
