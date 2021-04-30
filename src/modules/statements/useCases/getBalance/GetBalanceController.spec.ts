import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database/';

let connection: Connection;

describe('Get a balance of an user', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });
  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to show balance user', async () => {
    await request(app).post('/api/v1/users').send({
      name: 'user3',
      email: 'test3@test3.com',
      password: '123456',
    });

    const responseToken = await request(app).post('/api/v1/sessions').send({
      email: 'test3@test3.com',
      password: '123456',
    });

    const { token } = responseToken.body;

    await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 999,
        description: 'deposit supertest',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

      await request(app)
      .post('/api/v1/statements/withdraw')
      .send({
        amount: 998,
        description: 'withdraw supertest',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

      const response = await request(app)
      .get('/api/v1/statements/balance').send().set({
        Authorization: `Bearer ${token}`,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('balance');
      expect(response.body.balance).toEqual(1);
  });

  it('should not be able to get a balance with user non exists', async () => {
    const response = await request(app)
    .get('/api/v1/statements/balance').send().set({
      Authorization: 'Bearer invalid_TOken2015',
    });

    expect(response.status).toBe(401);
  });
});
