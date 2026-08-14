import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../users.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const users: any[] = [];

  const prismaMock = {
    user: {
      create: jest.fn(async ({ data }: any) => {
        const user = {
          id: String(users.length + 1),
          ...data,
        };

        users.push(user);
        return user;
      }),

      findFirst: jest.fn(async ({ where }: any) => {
        if (where?.OR) {
          return (
            users.find(
              (user) =>
                user.username === where.OR[0]?.username ||
                user.email === where.OR[1]?.email,
            ) ?? null
          );
        }

        return null;
      }),

      findUnique: jest.fn(async ({ where }: any) => {
        if (where?.username) {
          return (
            users.find(
              (user) => user.username === where.username,
            ) ?? null
          );
        }

        if (where?.email) {
          return (
            users.find(
              (user) => user.email === where.email,
            ) ?? null
          );
        }

        if (where?.id) {
          return (
            users.find(
              (user) => user.id === where.id,
            ) ?? null
          );
        }

        return null;
      }),
    },
  };

  beforeEach(async () => {
    users.length = 0;

    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        imports: [
          JwtModule.register({
            secret: 'test',
            signOptions: { expiresIn: '1h' },
          }),
        ],

        providers: [
          AuthService,
          UsersService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should register and login a user', async () => {
    const username = 'testuser';
    const password = 'secret123';

    const reg = await service.register(
      username,
      password,
      't@t.com',
    );

    expect(reg.username).toBe(username);

    const login = await service.login(
      username,
      password,
    );

    expect(login).toHaveProperty('access_token');
    expect(typeof login.access_token).toBe('string');
  });
});