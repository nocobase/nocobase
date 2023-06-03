import { ParseFilterOptions } from '@nocobase/utils';
import cloneDeep from 'lodash/cloneDeep';
import { get } from 'lodash';

export const formatParamsIntoObject = (object: { key: string; value: string }[]) => {
  return object.reduce((prev, curr) => {
    prev[curr?.key] = curr.value;
    return prev;
  }, {});
};

export const NAME_SPACE = 'custom-request';

export const variableRegExp = /^{{(.*)}}$/;
export const getTypeOfVariable = (variable: any) =>
  Object.prototype.toString.call(variable).match(/^\[object ([a-zA-Z]+)\]$/)?.[1];
export const parseFilter = (originData: any, opts: ParseFilterOptions) => {
  const tempRes = cloneDeep(originData);
  const typeofTempRes = getTypeOfVariable(tempRes);
  switch (typeofTempRes) {
    case 'Object':
      for (const originDataKey in originData) {
        const value = originData[originDataKey];
        const typeofValue = getTypeOfVariable(value);
        switch (typeofValue) {
          case 'String':
            {
              const realKey = value?.match(variableRegExp)?.[1] || '';
              if (realKey && realKey.startsWith('$')) {
                if (realKey.startsWith('$date')) {
                  tempRes[originDataKey] = get(opts.vars, realKey)(new Date());
                } else if (realKey.startsWith('$user.roles')) {
                  const key = realKey.split('.').pop();
                  // 用户角色里的uid 和它在currentUser 里面role里的名称不对应(name),需要单独处理
                  if (key === 'uid') {
                    tempRes[originDataKey] = opts.vars.$currentRole;
                  } else {
                    tempRes[originDataKey] = get(
                      (get(opts.vars.$user, 'roles') || []).filter((item) => item.name === opts.vars.$currentRole)[0],
                      key,
                    );
                  }
                } else {
                  tempRes[originDataKey] = get(opts.vars, realKey);
                }
              } else {
                tempRes[originDataKey] = value;
              }
            }
            break;
          case 'Object':
            tempRes[originDataKey] = parseFilter(value, opts);
            break;
          case 'Array':
            tempRes[originDataKey] = value.map((item) => parseFilter(item, opts));
            break;
          default:
            tempRes[originDataKey] = value;
            break;
        }
      }
      return tempRes;
    case 'Array':
      return tempRes.map((item) => parseFilter(item, opts));
    default:
      return tempRes;
  }
};
