import { verify } from 'jsonwebtoken';

import { CreateStatementError } from './CreateStatementError';

import { ICreateUserDTO } from '../../../users/useCases/createUser/ICreateUserDTO';
import { ICreateStatementDTO } from './ICreateStatementDTO'

import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';

import { CreateUserUseCase } from '../../../users/useCases/createUser/CreateUserUseCase';
import { AuthenticateUserUseCase } from '../../../users/useCases/authenticateUser/AuthenticateUserUseCase';
import { CreateStatementUseCase } from './CreateStatementUseCase';

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;

interface IPayload {
  sub: string;
}

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('Create Statements', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();

    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
  });

  it('should be able to create a deposit', async () => {
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

    const result = await createStatementUseCase.execute(deposit);

    expect(result).toHaveProperty('id');
    expect(result.type).toBe('deposit');
    expect(result.amount).toBe(500);
  });

  it('should not be able to create a deposit an non-existent user', () => {
    expect(async() => {
      const deposit: ICreateStatementDTO = {
        user_id: 'invalid-id',
        amount: 600,
        description: 'deposit test2',
        type: 'deposit' as OperationType
      }

      await createStatementUseCase.execute(deposit);
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it('should be able to create a withdraw', async () => {
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

    const result = await createStatementUseCase.execute(withdraw);

    expect(result).toHaveProperty('id');
    expect(result.type).toBe('withdraw');
    expect(result.amount).toBe(400);
  });

  it('should not be able to create a withdraw an non-existent user', () => {
    expect(async() => {
      const withdraw: ICreateStatementDTO = {
        user_id: 'invalid-id',
        amount: 600,
        description: 'deposit test2',
        type: 'withdraw' as OperationType
      }

      await createStatementUseCase.execute(withdraw);
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it('should not be able to create a withdraw with insufficient funds', () => {
    expect(async () => {
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
        amount: 600,
        description: 'deposit test',
        type: 'withdraw' as OperationType
      }

      await createStatementUseCase.execute(withdraw);
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  })
});
