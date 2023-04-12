export const getValuesByPath = (obj: object, path: string, defaultValue?: any) => {
  if (!obj) {
    return defaultValue;
  }
  const keys = path.split('.');
  let result: any[] = [];
  let currentValue = obj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (Array.isArray(currentValue)) {
      for (let j = 0; j < currentValue.length; j++) {
        const value = getValuesByPath(currentValue[j], keys.slice(i).join('.'), defaultValue);
        result = result.concat(value);
      }
      break;
    }

    currentValue = currentValue[key] === undefined ? defaultValue : currentValue[key];

    if (i === keys.length - 1) {
      result.push(currentValue);
    }
  }

  return result.length === 1 ? result[0] : result;
};
