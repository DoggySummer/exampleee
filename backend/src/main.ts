import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api'); // 모든 경로는 /api/...
  app.useGlobalFilters(new AllExceptionsFilter()); // 오류는 { message } 형식으로
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`🚀 API 서버: http://localhost:${port}/api (상태 확인: /api/health)`);
}
bootstrap();
