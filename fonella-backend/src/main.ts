import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global de versión según Contrato de API REST
  app.setGlobalPrefix('api/v1');

  // 1. Mecanismo de Seguridad: Cabeceras HTTP (Protección XSS / Clickjacking)
  app.use(helmet());

  // 2. Mecanismo de Seguridad: Lectura de Cookies JWT HttpOnly (ADR-03)
  app.use(cookieParser());

  // 3. Mecanismo de Seguridad: CORS estricto con envío de credenciales
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // 4. Mecanismo de Seguridad: Sanitización y bloqueo de campos no autorizados
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Fonella Backend API corriendo de forma segura en: http://localhost:${port}/api/v1`);
}
bootstrap();
