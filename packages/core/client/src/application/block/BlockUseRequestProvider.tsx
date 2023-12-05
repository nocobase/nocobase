import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { UseRequestResult, useRequest } from '../../api-client';

export interface BlockRequestContextValue<T = any> {
  requestResult: UseRequestResult<T>;
}

export const BlockRequestContextV2 = createContext<BlockRequestContextValue>({} as any);

export interface BlockRequestProviderProps {
  collection: string;
  action: string;
  filterByTk?: string;
  sourceId?: number | string;
  association?: string;
  params?: Record<string, any>;
  children?: ReactNode;
}

export const BlockRequestProviderV2: FC<BlockRequestProviderProps> = (props) => {
  const { collection, action, filterByTk, sourceId, association, params, children } = props;

  // /<collection>:<action>/<filterByTk>
  // /<collection>/<sourceId>/<association>:<action>/<filterByTk>
  const url = useMemo(() => {
    let res = '';
    if (!association) {
      res = collection;
    } else {
      // "association": "a.b"
      const arr = association.split('.');
      if (arr.length !== 2) {
        throw new Error(`${association} format is incorrect`);
      }
      res = `${arr[0]}/${sourceId}/${arr[1]}`;
    }

    res += ':' + action;
    if (filterByTk) {
      res += '/' + filterByTk;
    }

    return res;
  }, [collection, action, filterByTk, sourceId, association]);
  const paramsVal = useMemo(() => Object.values(params), [params]);

  const requestResult = useRequest(
    {
      url,
      params,
    },
    {
      refreshDeps: [paramsVal, url],
    },
  );
  return <BlockRequestContextV2.Provider value={{ requestResult }}>{children}</BlockRequestContextV2.Provider>;
};

export const useBlockRequestV2 = <T extends {}>(): BlockRequestContextValue<T>['requestResult'] => {
  const context = useContext(BlockRequestContextV2);
  if (!context) {
    throw new Error('useBlockRequest() must be used within a BlockRequestProvider');
  }

  return context.requestResult;
};
