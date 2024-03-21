const isEmptyFilter = (filter: any) => {
  if (filter === undefined || filter === null) {
    return true;
  }

  if (typeof filter === 'object' && Object.keys(filter).length === 0) {
    return true;
  }

  return false;
};

const mustHaveFilter = () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  const oldValue = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const options = args[0];

    if (Array.isArray(options.values)) {
      return oldValue.apply(this, args);
    }

    if (isEmptyFilter(options?.filter) && !options?.filterByTk && !options?.forceUpdate) {
      throw new Error(`must provide filter or filterByTk for ${propertyKey} call, or set forceUpdate to true`);
    }

    return oldValue.apply(this, args);
  };

  return descriptor;
};

export default mustHaveFilter;
