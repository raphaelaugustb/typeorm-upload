import { Router } from 'express';

import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import uploadConfig from '../config/upload';

const upload = multer(uploadConfig);

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const balance = await transactionsRepository.getBalance();
  const transactions = await transactionsRepository.find();
  const Transactions = {
    transactions,
    balance,
  };
  return response.json(Transactions);
});

transactionsRouter.post('/', async (request, response) => {
  const createTransactions = new CreateTransactionService();
  const { title, value, type, category } = request.body;

  const transaction = await createTransactions.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const deleteTransaction = new DeleteTransactionService();
  const { id } = request.params;
  const deleteResponse = await deleteTransaction.execute(id);

  return response.status(204).json(deleteResponse);
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    // TODO
    const importTransactionService = new ImportTransactionsService();

    const transactions = await importTransactionService.execute({
      csvFileName: request.file.filename,
    });

    return response.status(201).json({ transactions });
  },
);

export default transactionsRouter;
