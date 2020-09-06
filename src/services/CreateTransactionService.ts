import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Balance {
  total: number;
}

interface CreateTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: CreateTransaction): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const { total }: Balance = await transactionRepository.getBalance();
    const categoryCondition = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });
    let saveCategory = categoryCondition;
    if (!categoryCondition) {
      saveCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(saveCategory);
    }
    if (type === 'outcome' && value > total) {
      throw new AppError(
        "This Account doen't have insufficient total cash to take out",
      );
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: saveCategory?.id,
    });
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
