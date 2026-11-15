import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('DAMIRA Authentication & RBAC (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/login - should fail with invalid credentials', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'nonexistent_user', password: 'wrongpassword' })
      .expect(401);
  });

  it('GET /api/v1/customers - should fail without Bearer Token', async () => {
    return request(app.getHttpServer())
      .get('/api/v1/customers')
      .expect(401);
  });

  it('GET /api/v1/employees - should fail without Bearer Token', async () => {
    return request(app.getHttpServer())
      .get('/api/v1/employees')
      .expect(401);
  });
});
