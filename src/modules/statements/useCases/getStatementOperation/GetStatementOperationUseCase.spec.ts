import { verify } from 'jsonwebtoken';

import { GetStatementOperationError } from './GetStatementOperationError';

import { ICreateUserDTO } from '../../../users/useCases/createUser/ICreateUserDTO';

import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";

import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { GetStatementOperationUseCase } from './GetStatementOperationUseCase';



let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;

interface IPayload {
  sub: string;
}

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('list a statement', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();

    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
    getStatementOperationUseCase = new GetStatementOperationUseCase(inMemoryUsersRepository, inMemoryStatementsRepository)
  });

  it('should be able to list a specif statement', async () => {
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

    const  statement = await inMemoryStatementsRepository.create({
      user_id,
      amount: 500,
      description: 'deposit test',
      type: 'deposit' as OperationType
    })

    const statement_id = statement.id as string;

    const result = await getStatementOperationUseCase.execute({user_id, statement_id});

    expect(result).toHaveProperty('type');
    expect(result.amount).toBe(500);
    expect(result).toHaveProperty('id');
  });

  it('should not be able to view a statement a non existent user', () => {
    expect(async () => {
      const user_id = 'invalid_id321'

      const  statement = await inMemoryStatementsRepository.create({
        user_id,
        amount: 500,
        description: 'deposit test',
        type: 'deposit' as OperationType
      })

      const statement_id = statement.id as string;

      await getStatementOperationUseCase.execute({user_id, statement_id});
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  });

  it('should not be able to view a non existent statement', () => {
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

      const statement_id = 'invalid_id456';

      await getStatementOperationUseCase.execute({user_id, statement_id});
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  })
});
