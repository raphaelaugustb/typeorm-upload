import path from 'path';
import fs from 'fs';
import { uuid } from 'uuidv4';
import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import Transaction from '../models/Transaction';

import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';

interface Request {
  csvFileName: string;
}

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute({ csvFileName }: Request): Promise<Transaction[]> {
    // TODO
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
    const transactions: TransactionCSV[] = [];
    let categoriesArray: Category[] = [];

    let { total } = await transactionsRepository.getBalance();

    const csvCategories: string[] = [];
    const csvFile = path.join(uploadConfig.directory, csvFileName);
    const stream = fs.createReadStream(csvFile);

    const parser = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const csv = stream.pipe(parser);

    csv.on('data', line => {
      const [title, type, value, category] = line;
      const nvalue = Number(value);
      if (!title || !nvalue || !type)
        throw new AppError('All fields must be completed.');
      if (total < nvalue && type === 'outcome')
        throw new AppError(
          'You cannot register a outcome higher than your balance.',
        );
      if (type === 'income') {
        total += nvalue;
      } else {
        total -= nvalue;
      }
      transactions.push({ title, type, value: nvalue, category });
    });
    await new Promise(resolve => csv.on('end', resolve));

    transactions.forEach(transaction => {
      if (!csvCategories.includes(transaction.category))
        csvCategories.push(transaction.category);
    });

    const categories = await categoriesRepository.find({
      where: { title: In(csvCategories) },
    });
    const categoriesTitles = categories.map(category => category.title);

    const missingCategories = csvCategories.filter(
      titles => !categoriesTitles.includes(titles),
    );

    if (missingCategories) {
      categoriesArray = missingCategories.map(category =>
        categoriesRepository.create({ id: uuid(), title: category }),
      );
      await categoriesRepository.save(categoriesArray);
    }

    const allCategories = [...categoriesArray, ...categories];

    const finalTransactions = transactions.map(transaction =>
      transactionsRepository.create({
        id: uuid(),
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      }),
    );

    await transactionsRepository.save(finalTransactions);

    await fs.promises.unlink(csvFile);

    return finalTransactions;
  }
}

export default ImportTransactionsService;
