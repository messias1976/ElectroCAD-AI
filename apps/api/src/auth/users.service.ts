import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private inMemoryUsers: any[] = [];

  constructor(private prisma: PrismaService) {}

  private usingPrisma() { return !!process.env.DATABASE_URL; }

  async create(username: string, password: string, email?: string, role = 'SUBSCRIBER') {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    if (this.usingPrisma()) {
      try {
        return await this.prisma.user.create({
          data: { username, email, password: hash, role, trialStartedAt: new Date(), trialDays: 14 },
          select: { id: true, username: true, email: true, role: true },
        });
      } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
          const target = (error as { meta?: { target?: string[] } }).meta?.target;
          if (Array.isArray(target) && target.includes('email')) throw new BadRequestException('Email já cadastrado.');
          if (Array.isArray(target) && target.includes('username')) throw new BadRequestException('Nome de usuário já cadastrado.');
          throw new BadRequestException('Já existe um usuário com esses dados.');
        }
        throw error;
      }
    }
    const user = { id: String(this.inMemoryUsers.length + 1), username, passwordHash: hash, email, role };
    this.inMemoryUsers.push(user);
    return { id: user.id, username: user.username, email: user.email, role };
  }

  async findByUsername(username: string) {
    if (this.usingPrisma()) return this.prisma.user.findFirst({ where: { OR: [{ username }, { email: username }] } });
    return this.inMemoryUsers.find((u) => u.username === username || u.email === username);
  }

  async validatePassword(user: any, password: string) {
    const hash = this.usingPrisma() ? user.password : user.passwordHash;
    return bcrypt.compare(password, hash);
  }

  async getProfile(userId: string) {
    if (this.usingPrisma()) {
      return this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true, role: true, companyName: true, phone: true, whatsapp: true },
      });
    }
    const user = this.inMemoryUsers.find((u) => u.id === userId);
    return user ? { id: user.id, username: user.username, email: user.email, role: user.role, companyName: user.companyName || null, phone: user.phone || null, whatsapp: user.whatsapp || null } : null;
  }

  async updateProfile(userId: string, input: { username?: string; email?: string; companyName?: string; phone?: string; whatsapp?: string }) {
    const data = {
      ...(input.username?.trim() ? { username: input.username.trim() } : {}),
      ...(input.email?.trim() ? { email: input.email.trim().toLowerCase() } : {}),
      companyName: input.companyName?.trim() || null,
      phone: input.phone?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
    };
    if (!data.username || !data.email) throw new BadRequestException('Nome e e-mail são obrigatórios.');
    if (!/^\S+@\S+\.\S+$/.test(data.email)) throw new BadRequestException('Informe um e-mail válido.');
    if (this.usingPrisma()) {
      try {
        return await this.prisma.user.update({ where: { id: userId }, data, select: { id: true, username: true, email: true, role: true, companyName: true, phone: true, whatsapp: true } });
      } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') throw new BadRequestException('Nome de usuário ou e-mail já está em uso.');
        throw error;
      }
    }
    const user = this.inMemoryUsers.find((u) => u.id === userId);
    if (!user) throw new BadRequestException('Usuário não encontrado.');
    Object.assign(user, data);
    return this.getProfile(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) throw new BadRequestException('A nova senha deve ter pelo menos 6 caracteres.');
    if (this.usingPrisma()) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || !(await bcrypt.compare(currentPassword, user.password))) throw new BadRequestException('Senha atual incorreta.');
      const hash = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
      await this.prisma.user.update({ where: { id: userId }, data: { password: hash } });
      return { ok: true };
    }
    const user = this.inMemoryUsers.find((u) => u.id === userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) throw new BadRequestException('Senha atual incorreta.');
    user.passwordHash = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    return { ok: true };
  }
}
