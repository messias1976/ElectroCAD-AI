import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string, email?: string) {
    return this.users.create(username, password, email, 'SUBSCRIBER');
  }

  async validateUser(username: string, pass: string) {
    const user = await this.users.findByUsername(username);
    if (!user) return null;
    const valid = await this.users.validatePassword(user, pass);
    if (!valid) return null;
    return { id: user.id, username: user.username, email: user.email, role: user.role };
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    };
  }
}
