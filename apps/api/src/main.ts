import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.enableShutdownHooks();

  // Render/Cloudflare supplies CF-Ray on inbound requests. Keep it in logs
  // so production incidents can be traced end-to-end.
  app.use((req: any, res: any, next: () => void) => {
    const cfRay = req.headers['cf-ray'];
    if (cfRay) {
      console.info('[request]', {
        cfRay,
        method: req.method,
        path: req.originalUrl || req.url,
      });
    }
    next();
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
