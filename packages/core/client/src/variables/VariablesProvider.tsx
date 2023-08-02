import { getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAPIClient } from '../api-client';
import type { CollectionFieldOptions } from '../collection-manager';
import { useCollectionManager } from '../collection-manager';
import { useCompile } from '../schema-component';
import useBuildInVariables from './hooks/useBuiltinVariables';
import { VariableOption, VariablesContextType } from './types';

export const VariablesContext = createContext<VariablesContextType>(null);

const variableToCollectionName = {};

const TYPE_TO_ACTION = {
  hasMany: 'list',
  belongsTo: 'get',
  hasOne: 'get',
  belongsToMany: 'list',
};

const getAction = (type: string) => {
  if (process.env.NODE_ENV !== 'production' && !(type in TYPE_TO_ACTION)) {
    throw new Error(`VariablesProvider: unknown type: ${type}`);
  }

  return TYPE_TO_ACTION[type];
};

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
  const [ctx, setCtx] = useState<Record<string, any>>({});
  const api = useAPIClient();
  const { getCollectionJoinField } = useCollectionManager();
  const compile = useCompile();
  const { builtinVariables } = useBuildInVariables();

  useEffect(() => {
    ctxRef.current = ctx;
  }, [ctx]);

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
            if (item[key] === undefined) {
              if (associationField?.target) {
                return api
                  .request({
                    url: `/${collectionName}/${item.id}/${key}:${getAction(associationField.type)}`,
                  })
                  .then((data) => {
                    item[key] = data.data.data;
                    return item[key];
                  });
              }
            }
            return item[key];
          });
          current = _.flatten(await Promise.all(result));
        } else if (current[key] === undefined && associationField?.target) {
          const data = await api.request({
            url: `/${collectionName}/${current.id}/${key}:${getAction(associationField.type)}`,
          });
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
  const registerVariable = useCallback((variableOption: VariableOption) => {
    setCtx((prev) => {
      return {
        ...prev,
        [variableOption.name]: variableOption.ctx,
      };
    });
    ctxRef.current[variableOption.name] = variableOption.ctx;
    if (variableOption.collectionName) {
      variableToCollectionName[variableOption.name] = variableOption.collectionName;
    }
  }, []);

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
    delete ctxRef.current[variableName];
    delete variableToCollectionName[variableName];
  }, []);

  const parseVariable = useCallback(
    /**
     * 将变量字符串解析为真正的值
     * @param str 变量字符串
     * @param localVariable 局部变量，解析完成后会被清除
     * @returns
     */
    async (str: string, localVariable?: VariableOption) => {
      const matches = str.match(/\{\{\s*(.*?)\s*\}\}/g);

      if (!matches) {
        return str;
      }

      let old = null;
      if (localVariable) {
        // 1. 如果有局部变量，先把全局中同名的变量取出来
        old = getVariable(localVariable.name);
        // 2. 把局部变量注册到全局，这样就可以使用了
        registerVariable(localVariable);
      }

      const path = matches[0].replace(/\{\{\s*(.*?)\s*\}\}/g, '$1');
      const value = await getValue(path);

      // 3. 局部变量使用完成后，需要在全局中清除
      if (localVariable) {
        removeVariable(localVariable.name);
      }
      // 4. 如果有同名的全局变量，把它重新注册回去
      if (old) {
        registerVariable(old);
      }

      return value;
    },
    [getValue, getVariable, registerVariable, removeVariable],
  );

  const value = useMemo(
    () => ({
      ctx,
      setCtx,
      parseVariable,
      registerVariable,
      getVariable,
    }),
    [ctx, getVariable, parseVariable, registerVariable],
  );

  useEffect(() => {
    builtinVariables.forEach((variableOption) => {
      registerVariable(variableOption);
    });
  }, [builtinVariables, registerVariable]);

  return <VariablesContext.Provider value={value}>{children}</VariablesContext.Provider>;
};

VariablesProvider.displayName = 'VariablesProvider';

export default VariablesProvider;
