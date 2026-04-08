import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('TripFlex AI API')
    .setDescription('메뉴 이미지 OCR 및 번역 API (Google Cloud Vision 기반)')
    .setVersion('5.0.0')
    .addTag('AI', 'OCR 스캔 및 텍스트 분석')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
