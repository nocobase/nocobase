import type { Dispatch, SetStateAction } from 'react';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAPIClient } from '../api-client';
import type { CollectionFieldOptions } from '../collection-manager';
import { useCollectionManager } from '../collection-manager';
import { useCurrentUserContext } from '../user';

export interface VariablesContextType {
  ctx: Record<string, any>;
  setCtx: Dispatch<SetStateAction<Record<string, any>>>;
  parseVariable: (str: string) => Promise<any>;
}

export const VariablesContext = createContext<VariablesContextType>(null);

const VARIABLE_TO_COLLECTION_NAME = {
  $user: 'users',
};

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
    if (VARIABLE_TO_COLLECTION_NAME[item]) {
      return VARIABLE_TO_COLLECTION_NAME[item];
    }
    return item;
  });
  return result.join('.');
};

const VariablesProvider = ({ children }) => {
  const currentUser = useCurrentUserContext();
  const [ctx, setCtx] = useState<Record<string, any>>({});
  const api = useAPIClient();
  const { getCollectionJoinField } = useCollectionManager();

  useEffect(() => {
    setCtx((prev) => ({
      ...prev,
      $user: currentUser?.data?.data,
    }));
  }, [currentUser?.data?.data]);

  /**
   * 1. 从 `ctx` 中根据 `path` 取值
   * 2. 如果某个 `key` 不存在，且 `key` 是一个关联字段，则从 api 中获取数据，并缓存到 `ctx` 中
   * 3. 如果某个 `key` 不存在，且 `key` 不是一个关联字段，则返回当前值
   */
  const getValue = useCallback(
    async (variablePath: string) => {
      const list = variablePath.split('.');
      const variableName = list[0];
      const collectionName = getFieldPath(variableName);
      const variable = ctx[variableName];
      let current = ctx;

      if (!variable) {
        throw new Error(`VariablesProvider: ${variableName} is not found`);
      }

      for (let index = 0; index < list.length; index++) {
        if (current == null) {
          return current;
        }

        const item = list[index];
        let associationField: CollectionFieldOptions = null;
        if (
          current[item] === undefined &&
          (associationField = getCollectionJoinField(getFieldPath(list.slice(0, index + 1).join('.'))))?.target
        ) {
          const data = await api.request({
            url: `/${collectionName}/${variable.id}/${item}:${getAction(associationField.type)}`,
          });
          current[item] = data.data.data;
          current = current[item];
        } else {
          current = current[item];
        }
      }

      return current;
    },
    [api, ctx, getCollectionJoinField],
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

  const value = useMemo(
    () => ({
      ctx,
      setCtx,
      parseVariable,
    }),
    [ctx, parseVariable],
  );

  return <VariablesContext.Provider value={value}>{children}</VariablesContext.Provider>;
};

VariablesProvider.displayName = 'VariablesProvider';

export default VariablesProvider;
