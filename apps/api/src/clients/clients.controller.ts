import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { SubscriberAccessGuard } from '../subscriptions/guards/subscriber-access.guard';

@Controller('clients')
@UseGuards(AuthGuard('jwt'), SubscriberAccessGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateClientDto) {
    return this.clientsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.clientsService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.clientsService.findById(req.user.userId, req.user.role, id);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(req.user.userId, req.user.role, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.clientsService.remove(req.user.userId, req.user.role, id);
  }
}
