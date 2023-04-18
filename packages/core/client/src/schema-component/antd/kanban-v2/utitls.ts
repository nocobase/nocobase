 import {isEqual}  from 'lodash';

export function diffObjects(obj1, obj2) {
  if (isEqual(obj1, obj2)) {
    return undefined;
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return obj1;
    }
    return obj1.every((item, index) => isEqual(item, obj2[index])) ? undefined : obj1;
  }

  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    const diff = {};
    for (let key in obj1) {
      if (!obj2.hasOwnProperty(key) || !isEqual(obj1[key], obj2[key])) {
        diff[key] = obj1[key];
      }
    }
    return Object.keys(diff).length > 0 ? diff : undefined;
  }

  return obj1;
}

