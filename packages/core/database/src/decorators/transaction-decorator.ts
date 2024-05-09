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

      descriptor.value = async function (...rest) {
        let transaction;
        let newTransaction = false;

        if (rest.length > 0 && typeof rest[0] === 'object') {
          transaction = rest[0]['transaction'];
        }

        if (!transaction) {
          transaction = await transactionGenerator.apply(this);
          newTransaction = true;
        }

        // 需要将 newTransaction 注入到被装饰函数参数内
        if (newTransaction) {
          try {
            let callArguments;
            if (lodash.isPlainObject(rest[0])) {
              callArguments = {
                ...rest[0],
                transaction,
              };
            } else if (transactionInjector) {
              callArguments = transactionInjector(rest, transaction);
            } else if (lodash.isNull(rest[0]) || lodash.isUndefined(rest[0])) {
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
            throw err;
          }
        } else {
          return oldValue.apply(this, rest);
        }
      };

      return descriptor;
    };
  };
}
