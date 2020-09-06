import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(Transactionsid: string): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const findTransaction = await transactionRepository.findOne({
      where: {
        id: Transactionsid,
      },
    });
    if (!findTransaction) {
      throw new AppError('Invalid Transaction id', 404);
    }

    await transactionRepository.delete(findTransaction.id);
  }
}

export default DeleteTransactionService;
