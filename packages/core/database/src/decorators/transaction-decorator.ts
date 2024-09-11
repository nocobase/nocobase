/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';

export function transactionWrapperBuilder(transactionGenerator) {
  return function transaction(transactionInjector?) {
    return (target, name, descriptor) => {
      const oldValue = descriptor.value;

      descriptor.value = async function () {
        let transaction;
        let newTransaction = false;

        if (arguments.length > 0 && typeof arguments[0] === 'object') {
          transaction = arguments[0]['transaction'];
        }

        if (!transaction) {
          transaction = await transactionGenerator.apply(this);
          newTransaction = true;
        }

        transaction.afterCommit(() => {
          if (transaction.eventCleanupBinded) {
            return;
          }

          transaction.eventCleanupBinded = true;
          if (this.database) {
            this.database.removeAllListeners(`transactionRollback:${transaction.id}`);
          }
        });

        // 需要将 newTransaction 注入到被装饰函数参数内
        if (newTransaction) {
          try {
            let callArguments;
            if (lodash.isPlainObject(arguments[0])) {
              callArguments = {
                ...arguments[0],
                transaction,
              };
            } else if (transactionInjector) {
              callArguments = transactionInjector(arguments, transaction);
            } else if (lodash.isNull(arguments[0]) || lodash.isUndefined(arguments[0])) {
              callArguments = {
                transaction,
              };
            } else {
              throw new Error(`please provide transactionInjector for ${name} call`);
            }

            const results = await oldValue.call(this, callArguments);

            await transaction.commit();

            return results;
          } catch (err) {
            console.error(err);
            await transaction.rollback();

            if (this.database) {
              await this.database.emitAsync(`transactionRollback:${transaction.id}`);
              await this.database.removeAllListeners(`transactionRollback:${transaction.id}`);
            }
            throw err;
          }
        } else {
          return oldValue.apply(this, arguments);
        }
      };

      return descriptor;
    };
  };
}
