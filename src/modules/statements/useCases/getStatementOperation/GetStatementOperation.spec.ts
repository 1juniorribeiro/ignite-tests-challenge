import request from 'supertest';
import { Connection } from 'typeorm';
import { v4 as uuidV4} from 'uuid';

import { app } from '../../../../app';
import createConnection from '../../../../database/';

let connection: Connection;

describe('show the specific statement operation', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });
  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to show the specific statement operation', async () => {
    await request(app).post('/api/v1/users').send({
      name: 'user4',
      email: 'test4@test4.com',
      password: '123456',
    });

    const responseToken = await request(app).post('/api/v1/sessions').send({
      email: 'test4@test4.com',
      password: '123456',
    });

    const { token } = responseToken.body;

    const deposit = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 999,
        description: 'deposit supertest',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

      const { id } = deposit.body;

      const response = await request(app).get(`/api/v1/statements/${id}`).send().set({
        Authorization: `Bearer ${token}`,
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toEqual('deposit');
  });

  it('should not be able to view a statement a non existent user', async() =>{
    await request(app).post('/api/v1/users').send({
      name: 'user5',
      email: 'test5@test5.com',
      password: '123456',
    });

    const responseToken = await request(app).post('/api/v1/sessions').send({
      email: 'test5@test5.com',
      password: '123456',
    });

    const { token } = responseToken.body;

    const deposit = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 800,
        description: 'deposit supertest',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

      const { id } = deposit.body;

      const response = await request(app).get(`/api/v1/statements/${id}`).send().set({
        Authorization: 'Bearer invalidToken5689',
      });

      expect(response.status).toBe(401);
  });

  it('should not be able to view a non existent statement', async() =>{
    await request(app).post('/api/v1/users').send({
      name: 'user6',
      email: 'test6@test6.com',
      password: '123456',
    });

    const responseToken = await request(app).post('/api/v1/sessions').send({
      email: 'test6@test6.com',
      password: '123456',
    });

    const { token } = responseToken.body;

    const id = uuidV4();

    const response = await request(app).get(`/api/v1/statements/${id}`).send().set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(404);
  })
});
