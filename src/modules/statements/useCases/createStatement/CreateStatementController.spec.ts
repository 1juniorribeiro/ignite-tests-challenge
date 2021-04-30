import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database/';

let connection: Connection;

describe('Create statements', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    await request(app).post('/api/v1/users').send({
      name: 'user1',
      email: 'test1@test1.com',
      password: '123456',
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to create a new deposit', async () => {
    const responseToken = await request(app).post('/api/v1/sessions').send({
      email: 'test1@test1.com',
      password: '123456',
    });

    const { token } = responseToken.body;

    const response = await request(app)
    .post('/api/v1/statements/deposit')
    .send({
      amount: 500,
      description: 'Deposit supertest',
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(201);
    expect(response.body.amount).toBe(500);
    expect(response.body).toHaveProperty('id');
  });

  it('should not be able to create a deposit an non-existent user', async() => {
    const response = await request(app)
    .post('/api/v1/statements/deposit')
    .send({
      amount: 500,
      description: 'Deposit supertest',
    })
    .set({
      Authorization: 'Bearer invalidToken321',
    });

    expect(response.status).toBe(401);
  });

  it('should be able to create a new withdraw', async () => {
    const responseToken = await request(app).post('/api/v1/sessions').send({
      email: 'test1@test1.com',
      password: '123456',
    });

    const { token } = responseToken.body;

    await request(app)
    .post('/api/v1/statements/deposit')
    .send({
      amount: 500,
      description: 'withdraw supertest',
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    const response = await request(app)
    .post('/api/v1/statements/withdraw')
    .send({
      amount: 400,
      description: 'Deposit supertest',
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(201);
    expect(response.body.amount).toBe(400);
    expect(response.body).toHaveProperty('id');
  });

  it('should not be able to create a withdraw an non-existent user', async() => {
    const response = await request(app)
    .post('/api/v1/statements/withdraw')
    .send({
      amount: 500,
      description: 'withdraw supertest',
    })
    .set({
      Authorization: 'Bearer invalidToken321',
    });

    expect(response.status).toBe(401);
  });

  it('should not be able to create a new withdraw with insufficient funds', async () => {
    await request(app).post('/api/v1/users').send({
      name: 'user2',
      email: 'test2@test2.com',
      password: '123456',
    });

    const responseToken = await request(app).post('/api/v1/sessions').send({
      email: 'test2@test2.com',
      password: '123456',
    });

    const { token } = responseToken.body;

    const response = await request(app)
    .post('/api/v1/statements/withdraw')
    .send({
      amount: 800,
      description: 'withdraw supertest',
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(400);
  });
});
