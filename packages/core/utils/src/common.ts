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

export const hasEmptyValue = (objOrArr: object | any[]) => {
  let result = true;
  for (const key in objOrArr) {
    result = false;
    if (isArray(objOrArr[key]) && objOrArr[key].length === 0) {
      return true;
    }
    if (!objOrArr[key]) {
      return true;
    }
    if (isPlainObject(objOrArr[key]) || isArray(objOrArr[key])) {
      return hasEmptyValue(objOrArr[key]);
    }
  }
  return result;
};

export const nextTick = (fn: () => void) => {
  setTimeout(fn);
};
