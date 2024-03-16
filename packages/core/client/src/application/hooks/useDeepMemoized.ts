import _ from 'lodash';
import { useCreation } from 'ahooks';

export function highPerformanceCheckEqual(a: any, b: any) {
  if (a === b) {
    return true;
  }
  if (a == undefined && b == undefined) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (Array.isArray(a)) {
    return a.length === b.length && _.isEqual(a, b);
  }
  if (typeof a === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      // ignore
    }
  }
  return _.isEqual(a, b);
}

export const useDeepMemoized = (obj: any, ignoreUndefinedValue = false) => {
  const newObj = ignoreUndefinedValue ? _.omitBy(obj, _.isUndefined) : obj;

  const oldObj = useCreation(() => ({ value: _.cloneDeep(newObj) }), []);

  if (!highPerformanceCheckEqual(newObj, oldObj.value)) {
    oldObj.value = newObj;
  }

  return oldObj.value;
};
