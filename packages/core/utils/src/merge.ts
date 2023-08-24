import deepmerge from 'deepmerge';

const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray;

export function merge(obj1: any, obj2: any, opts?: any) {
  return deepmerge(obj1, obj2, {
    arrayMerge: overwriteMerge,
    ...opts,
  });
}
