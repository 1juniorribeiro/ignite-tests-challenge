import { OperationType, Statement } from "../../entities/Statement";
import { inject, injectable } from "tsyringe";

import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateTransferError } from "./CreateTransferError";
import { ICreateTransferDTO } from "./ICreateTransferDTO";

@injectable()
export class CreateTransfersUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({ amount, sender_id, description, receiver_id }: ICreateTransferDTO): Promise<Statement[]> {
    const senderUser = await this.usersRepository.findById(sender_id);
    const receiverUser = await this.usersRepository.findById(receiver_id);

    if(!senderUser) {
      throw new CreateTransferError.UserNotFound();
    }

    if(!receiverUser) {
      throw new CreateTransferError.ReceiverNotFound();
    }

    const senderBalance = await this.statementsRepository.getUserBalance({user_id: sender_id});

    if (senderBalance.balance < amount) {
      throw new CreateTransferError.InsufficientFunds();
    }

    const senderStatementOperation = await this.statementsRepository.create({
      user_id: sender_id,
      receiver_id,
      description,
      amount,
      type: OperationType.TRANSFER
    })

    const receiverStatementOperation = await this.statementsRepository.create({
      user_id: receiver_id,
      sender_id,
      description,
      amount,
      type: OperationType.TRANSFER
    })

    return [ senderStatementOperation, receiverStatementOperation ]
  }
}
