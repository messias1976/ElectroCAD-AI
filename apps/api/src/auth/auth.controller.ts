import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private users: UsersService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) { return this.auth.register(dto.username, dto.password, dto.email); }

  @Post('login')
  async login(@Body() dto: LoginDto) { return this.auth.login(dto.username, dto.password); }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  profile(@Req() req: any) { return this.users.getProfile(req.user.userId); }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() body: { username?: string; email?: string; companyName?: string; phone?: string; whatsapp?: string }) {
    return this.users.updateProfile(req.user.userId, body || {});
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('password')
  changePassword(@Req() req: any, @Body() body: { currentPassword?: string; newPassword?: string }) {
    return this.users.changePassword(req.user.userId, String(body?.currentPassword ?? ''), String(body?.newPassword ?? ''));
  }
}
