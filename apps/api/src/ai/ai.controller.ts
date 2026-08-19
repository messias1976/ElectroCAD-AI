import { Body, Controller, Get, Post, Put, Delete, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/roles.guard';
import { AiService, AiChatDto } from './ai.service';
import { SubscriberAccessGuard } from '../subscriptions/guards/subscriber-access.guard';

@Controller('ai')
@UseGuards(AuthGuard('jwt'), SubscriberAccessGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  async status() { return this.aiService.getStatus(); }

  @Post('test')
  @UseGuards(AdminGuard)
  async test(@Body() body: { apiKey?: string; model?: string }) { return this.aiService.testConnection(body.apiKey, body.model); }

  @Put('config')
  @UseGuards(AdminGuard)
  async saveConfig(@Body() body: { apiKey?: string; model?: string; enabled?: boolean }) { return this.aiService.saveConfig(body); }

  @Delete('config')
  @UseGuards(AdminGuard)
  async clearConfig() { return this.aiService.clearConfig(); }

  @Post('chat')
  async chat(@Req() req: any, @Body() body: AiChatDto) {
    return this.aiService.chat(body, req.user.userId, req.user.role);
  }
}
