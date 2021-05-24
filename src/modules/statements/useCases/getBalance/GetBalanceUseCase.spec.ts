import { verify } from 'jsonwebtoken';

import { GetBalanceError } from './GetBalanceError';

import { ICreateStatementDTO } from '../createStatement/ICreateStatementDTO';
import { ICreateUserDTO } from '../../../users/useCases/createUser/ICreateUserDTO';

import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';

import { CreateUserUseCase } from '../../../users/useCases/createUser/CreateUserUseCase';
import { AuthenticateUserUseCase } from '../../../users/useCases/authenticateUser/AuthenticateUserUseCase';
import { CreateStatementUseCase } from '../createStatement/CreateStatementUseCase';
import { GetBalanceUseCase } from './GetBalanceUseCase';

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let getBalanceUseCase: GetBalanceUseCase;

interface IPayload {
  sub: string;
}

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('Get user balance', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();

    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
    getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository)
  })

  it('should be able to show balance user', async () => {
    const user: ICreateUserDTO = {
      email: 'test@statement.com',
      name: 'statement test',
      password: '123456'
    }

    await createUserUseCase.execute(user);

    const userAuthenticated = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password
    })

    const { sub: user_id } = verify(userAuthenticated.token, 'senhasupersecreta123') as IPayload;

    const deposit: ICreateStatementDTO = {
      user_id,
      amount: 500,
      description: 'deposit test',
      type: 'deposit' as OperationType
    }

    await createStatementUseCase.execute(deposit);

    const withdraw: ICreateStatementDTO = {
      user_id,
      amount: 400,
      description: 'deposit test',
      type: 'withdraw' as OperationType
    }

    await createStatementUseCase.execute(withdraw);

    const result = await getBalanceUseCase.execute({user_id});


    expect(result.balance).toBe(100)
    expect(result.statement.length).toBe(2);
  });

  it('should not be able to list balance a non existent user', async () => {
      const user_id = 'invalid_id123'

      await expect (
        getBalanceUseCase.execute({user_id})
      ).rejects.toEqual(new GetBalanceError);
  })
});
