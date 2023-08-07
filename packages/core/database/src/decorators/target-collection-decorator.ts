import lodash from 'lodash';

const injectTargetCollection = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  const oldValue = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const options = args[0];
    const values = options.values;

    if (lodash.isPlainObject(values) && values.__collection) {
      options.targetCollection = values.__collection;
    }

    return oldValue.apply(this, args);
  };

  return descriptor;
};

export default injectTargetCollection;
