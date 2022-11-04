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
