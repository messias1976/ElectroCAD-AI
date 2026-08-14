import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../users.service';
import { JwtModule } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test', signOptions: { expiresIn: '1h' } })],
      providers: [AuthService, UsersService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should register and login a user', async () => {
    const username = 'testuser';
    const password = 'secret123';
    const reg = await service.register(username, password, 't@t.com');
    expect(reg.username).toBe(username);

    const login = await service.login(username, password);
    expect(login).toHaveProperty('access_token');
    expect(typeof login.access_token).toBe('string');
  });
});
