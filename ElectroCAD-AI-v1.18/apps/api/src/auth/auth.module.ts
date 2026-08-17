import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<string>('JWT_EXPIRES_IN') || '7d';
        return {
          secret:
            config.get<string>('JWT_SECRET') || 'troque_por_um_valor_secreto',
          signOptions: { expiresIn: expiresIn as any },
        };
      },
    }),
  ],
  providers: [AuthService, UsersService, JwtStrategy, PrismaService],
  controllers: [AuthController],
  exports: [AuthService, UsersService],
})
export class AuthModule {}
