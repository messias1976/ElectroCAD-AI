import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AdminGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AiController],
  providers: [AiService, AdminGuard, PrismaService],
})
export class AiModule {}
