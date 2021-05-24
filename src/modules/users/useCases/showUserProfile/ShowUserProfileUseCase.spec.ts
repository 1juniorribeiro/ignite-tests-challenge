import { ICreateUserDTO } from '../createUser/ICreateUserDTO';
import { InMemoryUsersRepository } from '../../repositories/in-memory/InMemoryUsersRepository';
import { ShowUserProfileError } from './ShowUserProfileError';


import { CreateUserUseCase } from '../createUser/CreateUserUseCase';
import { ShowUserProfileUseCase } from './ShowUserProfileUseCase';
import { AuthenticateUserUseCase } from '../authenticateUser/AuthenticateUserUseCase';
import { verify } from 'jsonwebtoken';

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let showUserProfileUseCase: ShowUserProfileUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

interface IPayload {
  sub: string;
}

describe('show profile user', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
  });

  it('should be able to show profile an user', async () => {
    const user: ICreateUserDTO = {
      email: 'test@test.com',
      name: 'user test',
      password: '12345'
    }

    await createUserUseCase.execute(user);

    const userAuthenticated = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password
    })

    const { sub: user_id } = verify(userAuthenticated.token, 'senhasupersecreta123') as IPayload;


    const id = user_id;

    const result = await showUserProfileUseCase.execute(id);

    expect(result).toHaveProperty('id');
    expect(result.email).toBe(user.email);
    expect(result.name).toBe(user.name);
  });

  it('should not be able to list a non-existent user', async () => {
      const id = 'invalididtoexample';

      await expect (
         showUserProfileUseCase.execute(id)
      ).rejects.toEqual(new ShowUserProfileError);
  })
});
