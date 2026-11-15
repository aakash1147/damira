import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('DAMIRA-Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const apiPrefix = configService.get<string>('apiPrefix', 'api/v1');
  const corsOrigin = configService.get<string>('cors.origin', 'http://localhost:4200');

  // Security Headers
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  );

  // Cross-Origin Resource Sharing
  app.enableCors({
    origin: corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global API Prefix
  app.setGlobalPrefix(apiPrefix);

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DAMIRA by Gupta - Business Management API')
    .setDescription(
      'Enterprise modular REST API specification for DAMIRA by Gupta: Employee Management, RBAC, Customer CRM, Multi-Address Management, Bulk Import, Master Data and Audit Logging.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your Bearer Access Token',
        in: 'header',
      },
      'bearer-jwt',
    )
    .addTag('Authentication', 'Login, token refresh, and password management')
    .addTag('Employees', 'Employee onboarding, directory, and status management')
    .addTag('Users', 'User accounts, credential provisioning, and lockouts')
    .addTag('Roles & Permissions', 'RBAC matrix, role creation, and permission queries')
    .addTag('Customers', 'CRM profiles, customer classification, and search')
    .addTag('Customer Addresses', 'Multi-address management per customer')
    .addTag('Customer Import', 'Bulk CSV/Excel import with error reporting')
    .addTag('Master Data', 'Geographical and system master classifications')
    .addTag('Audit Logs', 'System activity and data modification audit trail')
    .addTag('Dashboard', 'Executive summaries and business metrics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      displayRequestDuration: true,
    },
    customSiteTitle: 'DAMIRA API Docs',
  });

  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`  DAMIRA Business Management API running on:`);
  logger.log(`  URL: http://localhost:${port}/${apiPrefix}`);
  logger.log(`  Swagger Docs: http://localhost:${port}/api/docs`);
  logger.log(`====================================================`);
}

bootstrap();
