import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { AiModule } from './ai/ai.module';
import { PlansModule } from './plans/plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PaymentsModule,
    AuthModule,
    SubscriptionsModule,
    ClientsModule,
    ProjectsModule,
    AiModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
