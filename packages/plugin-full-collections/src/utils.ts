import deepmerge from 'deepmerge';
import cryptoRandomString from 'crypto-random-string';
import justHas from 'just-has';

const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray

export function merge(obj1: any, obj2: any) {
  return deepmerge(obj1, obj2, {
    arrayMerge: overwriteMerge,
  });
}

export function generateRandomString(options: any = {}) {
  const { prefix = '' } = options;
  // @ts-ignore
  return prefix+cryptoRandomString({
    length: 6,
    characters: 'abcdefghijklmnopqrstuvwxyz0123456789',
    ...options,
  });
}

export const has = justHas;
