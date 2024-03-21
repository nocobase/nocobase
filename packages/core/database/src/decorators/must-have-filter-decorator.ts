export function isValidFilter(condition: any) {
  // Check if condition is a non-empty object
  if (typeof condition === 'object' && condition !== null && Object.keys(condition).length > 0) {
    return true;
  }

  const group = condition.$and || condition.$or;

  if (!group) {
    return false;
  }

  return group.some((item) => {
    if (item.$and || item.$or) {
      return isValidFilter(item);
    }
    const [name] = Object.keys(item);
    if (!name || !item[name]) {
      return false;
    }
    const [op] = Object.keys(item[name]);

    if (!op || typeof item[name][op] === 'undefined') {
      return false;
    }

    return true;
  });
}

const mustHaveFilter = () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  const oldValue = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const options = args[0];

    if (Array.isArray(options.values)) {
      return oldValue.apply(this, args);
    }

    if (!isValidFilter(options?.filter) && !options?.filterByTk && !options?.forceUpdate) {
      throw new Error(`must provide filter or filterByTk for ${propertyKey} call, or set forceUpdate to true`);
    }

    return oldValue.apply(this, args);
  };

  return descriptor;
};

export default mustHaveFilter;
