import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { CreateTransfersUseCase } from './CreateTransfersUseCase';

enum OperationType {
  TRANSFER = 'transfer',
}

export class CreateTransferController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { amount, description } = request.body;
    const { user_id } = request.params;
    const { id: sender_id } = request.user;

    const transferStatement = container.resolve(CreateTransfersUseCase);

    const transfer = await transferStatement.execute({
      amount,
      description,
      sender_id,
      receiver_id: user_id
    })

    return response.status(201).json(transfer);
  }
}
