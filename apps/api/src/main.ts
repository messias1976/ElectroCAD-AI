import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

const apiRoutes = ['ai', 'auth', 'clients', 'health', 'payments', 'projects', 'subscriptions'];

function resolveWebDist() {
  const candidates = [
    join(process.cwd(), 'apps/web/dist'),
    join(process.cwd(), '../web/dist'),
    join(__dirname, '../../web/dist'),
  ];

  return candidates.find((candidate) => existsSync(join(candidate, 'index.html')));
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: true, credentials: true });

  const webDist = resolveWebDist();
  if (webDist) {
    app.useStaticAssets(webDist, { index: false });
    const server = app.getHttpAdapter().getInstance();
    server.get(/^\/(?!assets\/)(?!.*\.[^/]+$).*/, (req, res, next) => {
      const firstSegment = req.path.split('/').filter(Boolean)[0];
      if (apiRoutes.includes(firstSegment)) return next();
      return res.sendFile(join(webDist, 'index.html'));
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
