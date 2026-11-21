import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Swagger 문서: http://localhost:4000/api  (JSON: /api-json)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('3조 배달앱 API')
    .setDescription(
      '명세서 36개 API. 로그인(API 02) 응답의 token을 오른쪽 위 Authorize 에 넣으면 보호된 API를 호출할 수 있어요.\n\n' +
        '오류 응답은 항상 { "message": "..." } 형식이에요.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    autoTagControllers: false, // 명세서 번호 태그만 사용
  });
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', docExpansion: 'none' },
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`🚀 API 서버: http://localhost:${port}/api (Swagger 문서) · 상태 확인: /api/health`);
}
bootstrap();
