import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private inMemoryUsers: any[] = [];

  constructor(private prisma: PrismaService) {}

  private usingPrisma() {
    return !!process.env.DATABASE_URL;
  }

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
    if (this.usingPrisma()) {
      return this.prisma.user.findFirst({ where: { OR: [{ username }, { email: username }] } });
    }
    return this.inMemoryUsers.find((u) => u.username === username || u.email === username);
  }

  async validatePassword(user: any, password: string) {
    const hash = this.usingPrisma() ? user.password : user.passwordHash;
    return bcrypt.compare(password, hash);
  }
}
