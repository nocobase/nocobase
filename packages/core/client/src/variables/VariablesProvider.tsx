import { getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAPIClient } from '../api-client';
import type { CollectionFieldOptions } from '../collection-manager';
import { useCollectionManager } from '../collection-manager';
import { useCompile } from '../schema-component';
import useBuiltInVariables from './hooks/useBuiltinVariables';
import { VariableOption, VariablesContextType } from './types';
import { filterEmptyValues } from './utils/filterEmptyValues';
import { getAction } from './utils/getAction';
import { getPath } from './utils/getPath';
import { clearRequested, getRequested, hasRequested, stashRequested } from './utils/hasRequested';
import { REGEX_OF_VARIABLE, isVariable } from './utils/isVariable';
import { uniq } from './utils/uniq';

export const VariablesContext = createContext<VariablesContextType>(null);

const variableToCollectionName = {};

const getFieldPath = (variablePath: string) => {
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
  const { getCollectionJoinField } = useCollectionManager();
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
    async (variablePath: string) => {
      const list = variablePath.split('.');
      const variableName = list[0];
      let current = ctxRef.current;
      let collectionName = getFieldPath(variableName);

      if (process.env.NODE_ENV !== 'production' && !ctxRef.current[variableName]) {
        throw new Error(`VariablesProvider: ${variableName} is not found`);
      }

      for (let index = 0; index < list.length; index++) {
        if (current == null) {
          return current;
        }

        const key = list[index];
        const associationField: CollectionFieldOptions = getCollectionJoinField(
          getFieldPath(list.slice(0, index + 1).join('.')),
        );
        if (Array.isArray(current)) {
          const result = current.map((item) => {
            if (shouldToRequest(item[key]) && item.id != null) {
              if (associationField?.target) {
                const url = `/${collectionName}/${item.id}/${key}:${getAction(associationField.type)}`;
                if (hasRequested(url)) {
                  return getRequested(url);
                }
                const result = api
                  .request({
                    url,
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
            return item[key];
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
            });
            stashRequested(url, waitForData);
            data = await waitForData;
            clearRequested(url);
          }
          current[key] = data.data.data;
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
      if (process.env.NODE_ENV !== 'production' && !isVariable(`{{${variableOption.name}}}`)) {
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

  const removeVariable = useCallback((variableName: string) => {
    setCtx((prev) => {
      const next = { ...prev };
      delete next[variableName];
      return next;
    });
    delete variableToCollectionName[variableName];
  }, []);

  const onLocalVariablesReady = useCallback(
    async (localVariables: VariableOption | VariableOption[], handler: () => Promise<void>) => {
      let old = null;
      if (localVariables) {
        if (Array.isArray(localVariables)) {
          old = localVariables.map((item) => getVariable(item.name));
          localVariables.forEach((item) => registerVariable(item));
        } else {
          // 1. 如果有局部变量，先把全局中同名的变量取出来
          old = getVariable(localVariables.name);
          // 2. 把局部变量注册到全局，这样就可以使用了
          registerVariable(localVariables);
        }
      }

      await handler();

      // 3. 局部变量使用完成后，需要在全局中清除
      if (localVariables) {
        if (Array.isArray(localVariables)) {
          localVariables.forEach((item) => removeVariable(item.name));
        } else {
          removeVariable(localVariables.name);
        }
      }
      // 4. 如果有同名的全局变量，把它重新注册回去
      if (old) {
        if (Array.isArray(old)) {
          old.filter(Boolean).forEach((item) => registerVariable(item));
        } else {
          registerVariable(old);
        }
      }
    },
    [getVariable, registerVariable, removeVariable],
  );

  const parseVariable = useCallback(
    /**
     * 将变量字符串解析为真正的值
     * @param str 变量字符串
     * @param localVariables 局部变量，解析完成后会被清除
     * @returns
     */
    async (str: string, localVariables?: VariableOption | VariableOption[]) => {
      if (!isVariable(str)) {
        return str;
      }

      let value = null;
      await onLocalVariablesReady(localVariables, async () => {
        const path = getPath(str);
        value = await getValue(path);
      });

      return uniq(filterEmptyValues(value));
    },
    [getValue, onLocalVariablesReady],
  );

  const getCollectionField = useCallback(
    async (variableString: string, localVariables?: VariableOption | VariableOption[]) => {
      if (process.env.NODE_ENV !== 'production' && !isVariable(variableString)) {
        throw new Error(`VariablesProvider: ${variableString} is not a variable string`);
      }

      let result = null;

      await onLocalVariablesReady(localVariables, async () => {
        const matches = variableString.match(REGEX_OF_VARIABLE);
        const path = matches[0].replace(REGEX_OF_VARIABLE, '$1');

        result = getCollectionJoinField(getFieldPath(path));

        // 当仅有一个例如 `$user` 这样的字符串时，需要拼一个假的 `collectionField` 返回
        if (!result && !path.includes('.')) {
          result = {
            target: variableToCollectionName[path],
          };
        }
      });

      return result;
    },
    [getCollectionJoinField, onLocalVariablesReady],
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

/**
 * 判断是否应该请求关系字段的数据。如果是 null 则可以确定后端的数据为空，此时不需要请求；如果是 undefined 则需要请求。
 *
 * 注意：如果后端接口的这一 “规则” 发生了变更，那么可能会出现问题。
 * @param value
 * @returns
 */
function shouldToRequest(value) {
  return value === undefined;
}
