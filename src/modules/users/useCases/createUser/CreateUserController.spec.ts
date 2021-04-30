import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database/';

let connection: Connection;

describe('Create an user', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to create a new user', async () => {
    const response = await request(app).post('/api/v1/users').send({
      name: 'user Test',
      email: 'test@supertest.com',
      password: 'senha123',
    });

    expect(response.status).toBe(201);
  });

  it('should not be able to create a new user with same email', async () => {
    await request(app).post('/api/v1/users').send({
      name: 'user Test',
      email: 'test@supertest.com',
      password: 'senha123',
    });

    const response = await request(app).post('/api/v1/users').send({
      name: 'user Test2',
      email: 'test@supertest.com',
      password: 'senha1235',
    });

    expect(response.status).toBe(400);
  });
});
