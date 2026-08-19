import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/roles.guard';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  async list() {
    return this.plans.list();
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Put()
  async replace(@Body() body: any) {
    if (!Array.isArray(body)) {
      return this.plans.replace(Array.isArray(body?.plans) ? body.plans : []);
    }
    return this.plans.replace(body);
  }
}
