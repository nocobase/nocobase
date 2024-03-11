import _ from 'lodash';
import { useCreation } from 'ahooks';

export const useDeepMemoized = (obj: any, ignoreUndefinedValue = false) => {
  const newObj = ignoreUndefinedValue ? _.omitBy(obj, _.isUndefined) : obj;

  const oldObj = useCreation(() => ({ value: _.cloneDeep(newObj) }), []);

  if (!_.isEqual(newObj, oldObj.value)) {
    oldObj.value = _.cloneDeep(newObj);
  }

  return oldObj.value;
};
