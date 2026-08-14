import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { AsaasService } from './asaas.service';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [ConfigModule, SubscriptionsModule],
  controllers: [PaymentsController],
  providers: [AsaasService],
})
export class PaymentsModule {}
