import { get, isFunction } from 'lodash';

export const parseVariables = (str: string, ctx) => {
  if (str) {
    const result = get(ctx, str);
    return isFunction(result) ? result() : result;
  } else {
    return str;
  }
};
export function extractFilterfield(str) {
  const match = str.match(/^\$form\.([^.[\]]+)/);
  if (match) {
    return match[1];
  }
  return null;
}

export function extractValuesByPattern(obj, pattern) {
  const regexPattern = new RegExp(pattern.replace(/\*/g, '\\d+'));
  const result = [];

  for (const key in obj) {
    if (regexPattern.test(key)) {
      const value = obj[key];
      result.push(value);
    }
  }

  return result;
}
export function generatePattern(str, fieldName) {
  const result = str.replace(`$form.${fieldName}.`, `${fieldName}.*.`);
  return result;
}
