export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

export const isArray = (value: any): value is Array<any> => {
  return Array.isArray(value);
};

export const isEmpty = (value: unknown) => {
  if (isPlainObject(value)) {
    return Object.keys(value).length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return !value;
};

export const isPlainObject = (value) => {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
};
