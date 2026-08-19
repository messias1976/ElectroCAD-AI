import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SubscriberAccessGuard } from '../subscriptions/guards/subscriber-access.guard';

@Module({
  imports: [SubscriptionsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService, SubscriberAccessGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
