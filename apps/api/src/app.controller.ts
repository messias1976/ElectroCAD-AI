import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(@Req() req: Request) {
    return {
      status: 'ok',
      service: 'electrocad-api',
      timestamp: new Date().toISOString(),
      cfRay: req.header('CF-Ray') || null,
    };
  }
}
