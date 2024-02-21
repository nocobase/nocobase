import { raw, untracked } from '@formily/reactive';
import { getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAPIClient } from '../api-client';
import type { CollectionFieldOptions_deprecated } from '../collection-manager';
import { useCollectionManager_deprecated } from '../collection-manager';
import { useCompile } from '../schema-component';
import useBuiltInVariables from './hooks/useBuiltinVariables';
import { VariableOption, VariablesContextType } from './types';
import { filterEmptyValues } from './utils/filterEmptyValues';
import { getAction } from './utils/getAction';
import { getPath } from './utils/getPath';
import { clearRequested, getRequested, hasRequested, stashRequested } from './utils/hasRequested';
import { isVariable } from './utils/isVariable';
import { uniq } from './utils/uniq';

export const VariablesContext = createContext<VariablesContextType>(null);

const variableToCollectionName = {};

const getFieldPath = (variablePath: string, variableToCollectionName: Record<string, any>) => {
  const list = variablePath.split('.');
  const result = list.map((item) => {
    if (variableToCollectionName[item]) {
      return variableToCollectionName[item];
    }
    return item;
  });
  return result.join('.');
};

const VariablesProvider = ({ children }) => {
  const ctxRef = useRef<Record<string, any>>({});
  const api = useAPIClient();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const compile = useCompile();
  const { builtinVariables } = useBuiltInVariables();

  const setCtx = useCallback((ctx: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
    if (_.isFunction(ctx)) {
      ctxRef.current = ctx(ctxRef.current);
    } else {
      ctxRef.current = ctx;
    }
  }, []);

  /**
   * 1. 从 `ctx` 中根据 `path` 取值
   * 2. 如果某个 `key` 不存在，且 `key` 是一个关联字段，则从 api 中获取数据，并缓存到 `ctx` 中
   * 3. 如果某个 `key` 不存在，且 `key` 不是一个关联字段，则返回当前值
   */
  const getValue = useCallback(
    async (
      variablePath: string,
      localVariables?: VariableOption[],
      options?: {
        /** 第一次请求时，需要包含的关系字段 */
        appends?: string[];
      },
    ) => {
      const list = variablePath.split('.');
      const variableName = list[0];
      const _variableToCollectionName = mergeVariableToCollectionNameWithLocalVariables(
        variableToCollectionName,
        localVariables,
      );
      let current = mergeCtxWithLocalVariables(ctxRef.current, localVariables);
      let collectionName = getFieldPath(variableName, _variableToCollectionName);

      if (!(variableName in current)) {
        throw new Error(`VariablesProvider: ${variableName} is not found`);
      }

      for (let index = 0; index < list.length; index++) {
        if (current == null) {
          return current;
        }

        const key = list[index];
        const associationField: CollectionFieldOptions_deprecated = getCollectionJoinField(
          getFieldPath(list.slice(0, index + 1).join('.'), _variableToCollectionName),
        );
        if (Array.isArray(current)) {
          const result = current.map((item) => {
            if (shouldToRequest(item?.[key]) && item?.id != null) {
              if (associationField?.target) {
                const url = `/${collectionName}/${item.id}/${key}:${getAction(associationField.type)}`;
                if (hasRequested(url)) {
                  return getRequested(url);
                }
                const result = api
                  .request({
                    url,
                    params: {
                      appends: options?.appends,
                    },
                  })
                  .then((data) => {
                    clearRequested(url);
                    item[key] = data.data.data;
                    return item[key];
                  });
                stashRequested(url, result);
                return result;
              }
            }
            return item?.[key];
          });
          current = _.flatten(await Promise.all(result));
        } else if (shouldToRequest(current[key]) && current.id != null && associationField?.target) {
          const url = `/${collectionName}/${current.id}/${key}:${getAction(associationField.type)}`;
          let data = null;
          if (hasRequested(url)) {
            data = await getRequested(url);
          } else {
            const waitForData = api.request({
              url,
              params: {
                appends: options?.appends,
              },
            });
            stashRequested(url, waitForData);
            data = await waitForData;
            clearRequested(url);
          }

          // fix https://nocobase.height.app/T-3144，使用 `raw` 方法是为了避免触发 autorun，以修复 T-3144 的错误
          if (!raw(current)[key]) {
            // 把接口返回的数据保存起来，避免重复请求
            raw(current)[key] = data.data.data;
          }

          current = getValuesByPath(current, key);
        } else {
          current = getValuesByPath(current, key);
        }

        if (associationField?.target) {
          collectionName = associationField.target;
        }
      }

      return compile(_.isFunction(current) ? current() : current);
    },
    [getCollectionJoinField],
  );

  /**
   * 注册一个全局变量
   */
  const registerVariable = useCallback(
    (variableOption: VariableOption) => {
      if (!isVariable(`{{${variableOption.name}}}`)) {
        throw new Error(`VariablesProvider: ${variableOption.name} is not a valid name`);
      }

      setCtx((prev) => {
        return {
          ...prev,
          [variableOption.name]: variableOption.ctx,
        };
      });
      if (variableOption.collectionName) {
        variableToCollectionName[variableOption.name] = variableOption.collectionName;
      }
    },
    [setCtx],
  );

  const getVariable = useCallback((variableName: string): VariableOption => {
    if (!ctxRef.current[variableName]) {
      return null;
    }

    return {
      name: variableName,
      ctx: ctxRef.current[variableName],
      collectionName: variableToCollectionName[variableName],
    };
  }, []);

  const removeVariable = useCallback(
    (variableName: string) => {
      setCtx((prev) => {
        const next = { ...prev };
        delete next[variableName];
        return next;
      });
      delete variableToCollectionName[variableName];
    },
    [setCtx],
  );

  const parseVariable = useCallback(
    /**
     * 将变量字符串解析为真正的值
     * @param str 变量字符串
     * @param localVariables 局部变量，解析完成后会被清除
     * @returns
     */
    async (
      str: string,
      localVariables?: VariableOption | VariableOption[],
      options?: {
        /** 第一次请求时，需要包含的关系字段 */
        appends?: string[];
      },
    ) => {
      if (!isVariable(str)) {
        return str;
      }

      if (localVariables) {
        localVariables = _.isArray(localVariables) ? localVariables : [localVariables];
      }

      const path = getPath(str);
      const value = await getValue(path, localVariables as VariableOption[], options);

      return uniq(filterEmptyValues(value));
    },
    [getValue],
  );

  const getCollectionField = useCallback(
    async (variableString: string, localVariables?: VariableOption | VariableOption[]) => {
      if (!isVariable(variableString)) {
        throw new Error(`VariablesProvider: ${variableString} is not a variable string`);
      }

      if (localVariables) {
        localVariables = _.isArray(localVariables) ? localVariables : [localVariables];
      }

      const path = getPath(variableString);
      let result = getCollectionJoinField(
        getFieldPath(
          path,
          mergeVariableToCollectionNameWithLocalVariables(variableToCollectionName, localVariables as VariableOption[]),
        ),
      );

      // 当仅有一个例如 `$user` 这样的字符串时，需要拼一个假的 `collectionField` 返回
      if (!result && !path.includes('.')) {
        result = {
          target: variableToCollectionName[path],
        };
      }

      return result;
    },
    [getCollectionJoinField],
  );

  useEffect(() => {
    builtinVariables.forEach((variableOption) => {
      registerVariable(variableOption);
    });
  }, [builtinVariables, registerVariable]);

  const value = useMemo(
    () =>
      ({
        ctxRef,
        setCtx,
        parseVariable,
        registerVariable,
        getVariable,
        getCollectionField,
        removeVariable,
      }) as VariablesContextType,
    [getCollectionField, getVariable, parseVariable, registerVariable, removeVariable, setCtx],
  );

  return <VariablesContext.Provider value={value}>{children}</VariablesContext.Provider>;
};

VariablesProvider.displayName = 'VariablesProvider';

export default VariablesProvider;

function shouldToRequest(value) {
  let result = false;

  // value 有可能是一个响应式对象，使用 untracked 可以避免意外触发 autorun
  untracked(() => {
    // fix https://nocobase.height.app/T-2502
    // 兼容 `对多` 和 `对一` 子表单子表格字段的情况
    if (JSON.stringify(value) === '[{}]' || JSON.stringify(value) === '{}') {
      result = true;
      return;
    }

    result = _.isEmpty(value);
  });

  return result;
}

function mergeCtxWithLocalVariables(ctx: Record<string, any>, localVariables?: VariableOption[]) {
  ctx = { ...ctx };

  localVariables?.forEach((item) => {
    ctx[item.name] = item.ctx;
  });

  return ctx;
}

function mergeVariableToCollectionNameWithLocalVariables(
  variableToCollectionName: Record<string, any>,
  localVariables?: VariableOption[],
) {
  variableToCollectionName = { ...variableToCollectionName };

  localVariables?.forEach((item) => {
    if (item.collectionName) {
      variableToCollectionName[item.name] = item.collectionName;
    }
  });

  return variableToCollectionName;
}
