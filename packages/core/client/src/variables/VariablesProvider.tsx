import { dayjs, getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import type { Dispatch, SetStateAction } from 'react';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAPIClient } from '../api-client';
import type { CollectionFieldOptions } from '../collection-manager';
import { useCollectionManager } from '../collection-manager';
import { useCompile } from '../schema-component';
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
  const [ctx, setCtx] = useState<Record<string, any>>({
    $date: {
      now: () => dayjs().toISOString(),
    },
  });
  const api = useAPIClient();
  const { getCollectionJoinField } = useCollectionManager();
  const compile = useCompile();

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
            if (associationField?.target) {
              collectionName = associationField.target;
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
          collectionName = associationField.target;
        } else {
          current = getValuesByPath(current, key);
        }
      }

      return compile(_.isFunction(current) ? current() : current);
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
