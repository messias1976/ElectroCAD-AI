import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PlansController],
  providers: [PrismaService],
})
export class PlansModule {}
