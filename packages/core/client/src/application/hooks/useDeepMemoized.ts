import { isEqual } from 'lodash';
import { useRef } from 'react';
import _ from 'lodash';

export const useDeepMemoized = (newObj: any, ignoreUndefinedValue = false) => {
  const v = ignoreUndefinedValue ? _.omitBy(newObj, _.isUndefined) : newObj;

  const oldObj = useRef(v);

  if (!isEqual(v, oldObj.current)) {
    oldObj.current = v;
  }

  return oldObj.current;
};
