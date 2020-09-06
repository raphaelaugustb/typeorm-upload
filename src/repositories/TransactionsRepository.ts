import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const incomeBalance = transactions
      .filter(transaction => transaction.type === 'income')
      .reduce((acumulador, transaction) => {
        return acumulador + Number(transaction.value);
      }, 0);
    const outcomeBalance = transactions
      .filter(transaction => transaction.type === 'outcome')
      .reduce((acumulador, transaction) => {
        return acumulador + Number(transaction.value);
      }, 0);

    const balance = {
      income: incomeBalance,
      outcome: outcomeBalance,
      total: incomeBalance - outcomeBalance,
    };

    return balance;
  }
}

export default TransactionsRepository;
