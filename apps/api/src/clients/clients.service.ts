import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateClientDto) {
    return this.prisma.client.create({ data: { name: dto.name, segment: dto.segment, ownerId } });
  }

  async findAll(userId: string, role: string) {
    return this.prisma.client.findMany({
      where: role === 'ADMIN' ? undefined : { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { projects: true } } },
    });
  }

  async findById(userId: string, role: string, id: string) {
    const client = await this.prisma.client.findUnique({ where: { id }, include: { _count: { select: { projects: true } } } });
    if (!client) throw new NotFoundException('Cliente não encontrado.');
    if (role !== 'ADMIN' && client.ownerId !== userId) throw new ForbiddenException('Você não tem acesso a este cliente.');
    return client;
  }

  async update(userId: string, role: string, id: string, dto: UpdateClientDto) {
    await this.findById(userId, role, id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(userId: string, role: string, id: string) {
    await this.findById(userId, role, id);
    return this.prisma.client.delete({ where: { id } });
  }
}
