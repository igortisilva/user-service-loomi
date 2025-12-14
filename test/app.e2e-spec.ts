import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('User Service (e2e)', () => {
  let app: INestApplication;
  let userId: string;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
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

  describe('/api/users (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
          address: '123 Test St',
          phone: '+1234567890',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('test@example.com');
          expect(res.body).not.toHaveProperty('password');
          userId = res.body.id;
        });
    });

    it('should return 409 if user already exists', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        })
        .expect(409);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login user and return token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          authToken = res.body.access_token;
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('/api/users/:userId (GET)', () => {
    it('should get user by id', () => {
      return request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
          expect(res.body.email).toBe('test@example.com');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('/api/users/:userId (PATCH)', () => {
    it('should update user', () => {
      return request(app.getHttpServer())
        .patch(`/api/users/${userId}`)
        .send({
          name: 'Updated Name',
          address: '456 New St',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Name');
          expect(res.body.address).toBe('456 New St');
        });
    });
  });

  describe('/api/users/:userId/banking-details (PATCH)', () => {
    it('should update banking details', () => {
      return request(app.getHttpServer())
        .patch(`/api/users/${userId}/banking-details`)
        .send({
          accountNumber: '123456-7',
          branch: '0001',
          bankName: 'Test Bank',
          accountType: 'CHECKING',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.bankingDetails).toBeDefined();
          expect(res.body.bankingDetails.accountNumber).toBe('123456-7');
        });
    });
  });

  describe('/api/users/:userId (DELETE)', () => {
    it('should delete user', () => {
      return request(app.getHttpServer())
        .delete(`/api/users/${userId}`)
        .expect(204);
    });

    it('should return 404 after deletion', () => {
      return request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .expect(404);
    });
  });
});
