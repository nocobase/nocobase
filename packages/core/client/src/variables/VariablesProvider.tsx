import { getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
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
  if (!(type in TYPE_TO_ACTION)) {
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
  const [ctx, setCtx] = useState<Record<string, any>>({});
  const api = useAPIClient();
  const { getCollectionJoinField } = useCollectionManager();
  const compile = useCompile();
  const { builtinVariables } = useBuildInVariables();

  /**
   * 1. 从 `ctx` 中根据 `path` 取值
   * 2. 如果某个 `key` 不存在，且 `key` 是一个关联字段，则从 api 中获取数据，并缓存到 `ctx` 中
   * 3. 如果某个 `key` 不存在，且 `key` 不是一个关联字段，则返回当前值
   */
  const getValue = useCallback(
    async (variablePath: string) => {
      const list = variablePath.split('.');
      const variableName = list[0];
      let current = ctx;
      let collectionName = getFieldPath(variableName);

      if (!ctx[variableName]) {
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
    [ctx, getCollectionJoinField],
  );

  const parseVariable = useCallback(
    async (str: string) => {
      const matches = str.match(/\{\{\s*(.*?)\s*\}\}/g);

      if (!matches) {
        return str;
      }

      const path = matches[0].replace(/\{\{\s*(.*?)\s*\}\}/g, '$1');
      return getValue(path);
    },
    [getValue],
  );

  const registerVariable = useCallback((variableOption: VariableOption) => {
    setCtx((prev) => ({
      ...prev,
      [variableOption.name]: variableOption.ctx,
    }));
    if (variableOption.collectionName) {
      variableToCollectionName[variableOption.name] = variableOption.collectionName;
    }
  }, []);

  const getVariable = useCallback(
    (variableName: string): VariableOption => {
      return {
        name: variableName,
        ctx: ctx[variableName],
        collectionName: variableToCollectionName[variableName],
      };
    },
    [ctx],
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
