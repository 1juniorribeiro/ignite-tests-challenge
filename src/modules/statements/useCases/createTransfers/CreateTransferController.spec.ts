import request from 'supertest';
import { Connection } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';

import { app } from '../../../../app';
import createConnection from '../../../../database/';

let connection: Connection;

describe('Create a transfer', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    await request(app).post('/api/v1/users').send({
      name: 'user2',
      email: 'test2@test2.com',
      password: '1234567',
    });

    await request(app).post('/api/v1/users').send({
      name: 'user3',
      email: 'test3@test3.com',
      password: '12345678',
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to create a new transfer', async () => {
    const responseToken = await request(app).post('/api/v1/sessions').send({
      email: 'test2@test2.com',
      password: '1234567',
    });

    const { token } = responseToken.body;

    await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 500,
        description: 'Deposit supertest to transfer',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const responseTokenReceiverUser = await request(app).post('/api/v1/sessions').send({
      email: 'test3@test3.com',
      password: '12345678',
    });

    const { user } = responseTokenReceiverUser.body;

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${user.id}`)
      .send({
        amount: 200,
        description: 'Donate test',
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    const [senderStatement, receiverStatement] = response.body;

    expect(response.status).toBe(201);
    expect(response.body.length).toBe(2);
    expect(senderStatement.amount).toBe(200);
    expect(receiverStatement.amount).toBe(200);
    expect(senderStatement).toHaveProperty('receiver_id');
    expect(receiverStatement).toHaveProperty('sender_id');
    expect(senderStatement.type).toEqual('transfer');
    expect(receiverStatement.type).toEqual('transfer');
  });

  it('should not be able to create a transfer with a non-existent user', async () => {
    const responseTokenReceiverUser = await request(app).post('/api/v1/sessions').send({
      email: 'test3@test3.com',
      password: '12345678',
    });

    const { user } = responseTokenReceiverUser.body;

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${user.id}`)
      .send({
        amount: 200,
        description: 'Donate test',
      })
      .set({
        Authorization: `Bearer invalid_token`
      });

      expect(response.status).toBe(401);
  });

  it('should not be able to create a transfer with receiver user non-existent', async () => {
    const responseToken = await request(app).post('/api/v1/sessions').send({
      email: 'test2@test2.com',
      password: '1234567',
    });

    const { token } = responseToken.body;

    const id = uuidV4();

    const response = await request(app)
    .post(`/api/v1/statements/transfers/${id}`)
    .send({
      amount: 200,
      description: 'Donate test',
    })
    .set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(404);
  });

  it('should not be able to create a new transfer with insufficient funds', async () => {
    const responseToken = await request(app).post('/api/v1/sessions').send({
      email: 'test2@test2.com',
      password: '1234567',
    });

    const { token } = responseToken.body;

    const responseTokenReceiverUser = await request(app).post('/api/v1/sessions').send({
      email: 'test3@test3.com',
      password: '12345678',
    });

    const { user } = responseTokenReceiverUser.body;

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${user.id}`)
      .send({
        amount: 500,
        description: 'Donate test',
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(400);
  });
})
