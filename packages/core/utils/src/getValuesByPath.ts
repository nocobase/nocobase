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
      for (const element of currentValue) {
        const value = getValuesByPath(element, keys.slice(i).join('.'), defaultValue);
        result = result.concat(value);
      }
      break;
    }

    if (currentValue?.[key] === undefined) {
      break;
    }
    currentValue = currentValue[key];

    if (i === keys.length - 1) {
      result.push(currentValue);
    }
  }

  result = result.filter(Boolean);

  if (result.length === 0) {
    return defaultValue;
  }

  return result.length === 1 ? result[0] : result;
};
