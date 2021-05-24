import { verify } from "jsonwebtoken";

import { OperationType } from "../../entities/Statement";

import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";

import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { CreateTransfersUseCase } from "./CreateTransfersUseCase";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";

import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { ICreateTransferDTO } from "./ICreateTransferDTO";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetBalanceUseCase } from "../getBalance/GetBalanceUseCase";
import { CreateTransferError } from "./CreateTransferError";


let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let createTransfersUseCase: CreateTransfersUseCase;
let getUserBalanceUseCase: GetBalanceUseCase;

interface IPayload {
  sub: string;
}

describe('Create Transfers', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();

    getUserBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository)
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository)
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
    createTransfersUseCase = new CreateTransfersUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
  });

  it('should be able to create a new transfer', async () => {
    const senderUser: ICreateUserDTO = {
      email: 'inafumko@menehen.ls',
      name: 'Olivia Day',
      password: '123456'
    }

    const receiverUser: ICreateUserDTO = {
      email: 'dazre@ruje.bo',
      name: 'Adrian Fletcher',
      password: '1234567'
    }

    await createUserUseCase.execute(senderUser);
    const receiverUserCreated = await createUserUseCase.execute(receiverUser);


    const userAuthenticated = await authenticateUserUseCase.execute({
      email: senderUser.email,
      password: senderUser.password
    })

    const { sub: user_id } = verify(userAuthenticated.token, 'senhasupersecreta123') as IPayload;

    const deposit: ICreateStatementDTO = {
      user_id,
      amount: 500,
      description: 'deposit test',
      type: OperationType.DEPOSIT
    }

    await createStatementUseCase.execute(deposit);

    const transfer: ICreateTransferDTO = {
      amount: 200,
      description: 'donate',
      sender_id: user_id,
      receiver_id: receiverUserCreated.id as string,
    }

    const result = await createTransfersUseCase.execute(transfer);

    const senderBalance = await getUserBalanceUseCase.execute({ user_id })
    const receiverBalance = await getUserBalanceUseCase.execute({ user_id: receiverUserCreated.id as string })

    expect(result.length).toBe(2);
    expect(senderBalance.balance).toEqual(300 || 300.00)
    expect(senderBalance.statement.length).toBe(2)
    expect(receiverBalance.balance).toEqual(200 || 200.00)
    expect(receiverBalance.statement.length).toBe(1)
  });

  it('should not be able to make a transfer a non-existent user', async() => {
      const receiverUser: ICreateUserDTO = {
        email: 'dazre@ruje.bo',
        name: 'Adrian Fletcher',
        password: '1234567'
      }

      const receiverUserCreated = await createUserUseCase.execute(receiverUser);

      const transfer: ICreateTransferDTO = {
        amount: 200,
        description: 'test',
        sender_id: 'user_id_invalid',
        receiver_id: receiverUserCreated.id as string,
      }

      await expect(
        createTransfersUseCase.execute(transfer)
      ).rejects.toEqual(new CreateTransferError.UserNotFound)
  });

  it('should not be able to create a transfer with receiver non-existent', async () => {
    const senderUser: ICreateUserDTO = {
      email: 'mifi@wi.uk',
      name: 'Georgie Howell',
      password: '123456'
    }

    await createUserUseCase.execute(senderUser);

    const userAuthenticated = await authenticateUserUseCase.execute({
      email: senderUser.email,
      password: senderUser.password
    })

    const { sub: user_id } = verify(userAuthenticated.token, 'senhasupersecreta123') as IPayload;

    const transfer: ICreateTransferDTO = {
      amount: 200,
      description: 'donate',
      sender_id: user_id,
      receiver_id: 'invalid_receiver_id',
    }

    await expect(
      createTransfersUseCase.execute(transfer)
    ).rejects.toEqual(new CreateTransferError.ReceiverNotFound);
  });

  it('should not be able to create a transfer with insufficient funds', async () => {
    const senderUser: ICreateUserDTO = {
      email: 'kaol@gaklu.lr',
      name: 'Anthony Campbell',
      password: '123456'
    }

    const receiverUser: ICreateUserDTO = {
      email: 'fifa@mabonen.tt',
      name: 'Birdie Chandler',
      password: '1234567'
    }

    await createUserUseCase.execute(senderUser);
    const receiverUserCreated = await createUserUseCase.execute(receiverUser);


    const userAuthenticated = await authenticateUserUseCase.execute({
      email: senderUser.email,
      password: senderUser.password
    });

    const { sub: user_id } = verify(userAuthenticated.token, 'senhasupersecreta123') as IPayload;

    const transfer: ICreateTransferDTO = {
      amount: 200,
      description: 'donate',
      sender_id: user_id,
      receiver_id: receiverUserCreated.id as string,
    }

    await expect(
      createTransfersUseCase.execute(transfer)
    ).rejects.toEqual(new CreateTransferError.InsufficientFunds)
  });
});
