import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database/';

let connection: Connection;

describe('Authenticate an user', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to authenticate an user', async () => {
    await request(app).post('/api/v1/users').send({
      name: 'user Test',
      email: 'test@supertest.com',
      password: 'senha123',
    });

    const response = await request(app).post('/api/v1/sessions').send({
      email: 'test@supertest.com',
      password: 'senha123',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should not be able to authenticate a non existent user', async () => {
    const response = await request(app).post('/api/v1/sessions').send({
      email: 'test2@supertest.com',
      password: 'senha123',
    });

    expect(response.status).toBe(401);
  });

  it('should not be able to authenticate with incorrect password', async () => {
    await request(app).post('/api/v1/users').send({
      name: 'user Test3',
      email: 'test3@supertest.com',
      password: 'senha12345',
    });

    const response = await request(app).post('/api/v1/sessions').send({
      email: 'test3@supertest.com',
      password: 'incorrectPassword',
    });

    expect(response.status).toBe(401);
  })
});
