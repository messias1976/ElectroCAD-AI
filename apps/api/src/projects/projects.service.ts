import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private async ensureClientAccess(userId: string, role: string, clientId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Cliente não encontrado.');
    if (role !== 'ADMIN' && client.ownerId !== userId) {
      throw new ForbiddenException('Você não tem acesso a este cliente.');
    }
  }

  async create(userId: string, role: string, dto: CreateProjectDto) {
    await this.ensureClientAccess(userId, role, dto.clientId);
    return this.prisma.project.create({
      data: {
        name: dto.name,
        clientId: dto.clientId,
        description: dto.description ?? '',
        projectData: dto.projectData ?? null,
        userId: role === 'ADMIN' ? userId : userId,
      },
      include: { client: true },
    });
  }

  async findAll(userId: string, role: string) {
    return this.prisma.project.findMany({
      where: role === 'ADMIN' ? undefined : { userId },
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    });
  }

  async findById(userId: string, role: string, id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado.');
    if (role !== 'ADMIN' && project.userId !== userId) {
      throw new ForbiddenException('Você não tem acesso a este projeto.');
    }
    return project;
  }

  async update(userId: string, role: string, id: string, dto: UpdateProjectDto) {
    await this.findById(userId, role, id);
    if (dto.clientId) await this.ensureClientAccess(userId, role, dto.clientId);
    return this.prisma.project.update({
      where: { id },
      data: dto,
      include: { client: true },
    });
  }

  async remove(userId: string, role: string, id: string) {
    await this.findById(userId, role, id);
    return this.prisma.project.delete({ where: { id } });
  }
}
