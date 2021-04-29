import { ICreateUserDTO } from './ICreateUserDTO';
import { InMemoryUsersRepository } from '../../repositories/in-memory/InMemoryUsersRepository';
import { CreateUserError } from './CreateUserError';

import { CreateUserUseCase } from './CreateUserUseCase';

let createUserUseCase: CreateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe('Create User', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  })

  it('should be able to create a new user', async () => {
    const user: ICreateUserDTO = {
      name: 'user1',
      email: 'user1@test.com',
      password: '12345'
    }

    await createUserUseCase.execute(user);

    const userCreated = await inMemoryUsersRepository.findByEmail(user.email)

    expect(userCreated).toHaveProperty('id');
  });

  it('should not be able to create a new user with same email', async () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        name: 'user2',
        email: 'user2@test.com',
        password: '12345'
      }

      await createUserUseCase.execute(user);

      await createUserUseCase.execute(user);
    }).rejects.toBeInstanceOf(CreateUserError);
  });
})
