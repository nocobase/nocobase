const mustHaveFilter = () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  const oldValue = descriptor.value;

  descriptor.value = function () {
    const options = arguments[0];

    if (Array.isArray(options.values)) {
      return oldValue.apply(this, arguments);
    }

    if (!options?.filter && !options?.filterByTk && !options?.forceUpdate) {
      throw new Error(`must provide filter or filterByTk for ${propertyKey} call, or set forceUpdate to true`);
    }

    return oldValue.apply(this, arguments);
  };

  return descriptor;
};

export default mustHaveFilter;
