import { Body, Controller, Delete, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/roles.guard';
import { AiGenerateProjectDto, AiService, AiChatDto } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
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
  async chat(@Req() req: any, @Body() body: AiChatDto) { return this.aiService.chat(body, req.user.userId, req.user.role); }

  @Post('generate-project')
  async generateProject(@Req() req: any, @Body() body: AiGenerateProjectDto) {
    return this.aiService.generateProject(body, req.user.userId, req.user.role);
  }
}
