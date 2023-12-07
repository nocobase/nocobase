import React, { FC, createContext, useContext, useMemo, useState } from 'react';
import { UseRequestResult, useRequest } from '../../api-client';
import { useDeepCompareEffect } from 'ahooks';
import { BlockContextProps, useBlockV2 } from './BlockProvider';
import { AxiosRequestConfig } from 'axios';
import { RecordProviderV2 } from './RecordProvider';

export interface BlockRequestContextValue<T = any> {
  requestResult: UseRequestResult<T>;
}

export const BlockRequestContextV2 = createContext<BlockRequestContextValue>({} as any);

function useCurrentRequest(options: Omit<BlockContextProps, 'type'>) {
  const { action, sourceId, params = {}, filterByTk, record, association, collection } = options;
  const url = useMemo(() => {
    if (record) return;

    //  <collection>:<action>/<filterByTk>
    if (!association) {
      return `${collection}:${action}${filterByTk ? `/${filterByTk}` : ''}`;
    }
    // "association": "Collection.Field"
    // /<collection>/<sourceId>/<association>:<action>/<filterByTk>
    const arr = association.split('.');
    if (arr.length !== 2) {
      throw new Error(`${association} format is incorrect`);
    }
    return `${arr[0]}/${sourceId}/${arr[1]}:${action}${filterByTk ? `/${filterByTk}` : ''}`;
  }, [record, association, sourceId, action, filterByTk, collection]);

  const useRequestOptions = useMemo(() => {
    if (record) return () => Promise.resolve(record.current);
    if (!action) {
      throw new Error(`[nocobase]: The 'action' parameter is missing in the BlockRequestProvider component`);
    }
    return {
      url,
      params,
      method: action === 'create' ? 'POST' : 'GET',
    } as AxiosRequestConfig;
  }, [action, params, record, url]);

  const res = useRequest(useRequestOptions, {
    manual: true,
  });

  // 因为修改 Schema 会导致 params 对象发生变化，所以这里使用 `DeepCompare`
  useDeepCompareEffect(() => {
    if (action !== 'create') {
      res.run();
    }
  }, [params, url, !!record]);

  return res;
}

function useParentRequest(options: Omit<BlockContextProps, 'type'>) {
  const { sourceId, association, parentRecord } = options;

  const useRequestOptions = useMemo(() => {
    if (parentRecord) return () => Promise.resolve(parentRecord.current);
    if (!association) return () => Promise.resolve(undefined);
    // "association": "Collection.Field"
    const arr = association.split('.');
    // <collection>:<action>/<filterByTk>
    const url = `${arr[0]}:get/${sourceId}`; // ??
    return {
      url,
    } as AxiosRequestConfig;
  }, [association, parentRecord, sourceId]);

  return useRequest(useRequestOptions, {
    refreshDeps: [association, parentRecord, sourceId, !!parentRecord],
  });
}

export const BlockRequestProviderV2: FC = ({ children }) => {
  const { props } = useBlockV2();
  const { action, filterByTk, sourceId, params = {}, association, collection, record, parentRecord } = props;
  const { filterByTk: paramsFilterByTk, ...otherParams } = params;
  const currentRequest = useCurrentRequest({
    action,
    sourceId,
    record,
    association,
    collection,
    filterByTk: filterByTk || paramsFilterByTk,
    params: otherParams,
  });

  const parentRequest = useParentRequest({
    sourceId,
    association,
    parentRecord,
  });

  return (
    <BlockRequestContextV2.Provider value={{ requestResult: currentRequest }}>
      {action !== 'list' || record || parentRecord ? (
        <RecordProviderV2
          current={currentRequest.data}
          parent={parentRequest.data}
          record={record}
          parentRecord={parentRecord}
          isNew={action === 'create'}
        >
          {children}
        </RecordProviderV2>
      ) : (
        children
      )}
    </BlockRequestContextV2.Provider>
  );
};

export const useBlockRequestV2 = <T extends {}>(showError = true): BlockRequestContextValue<T>['requestResult'] => {
  const context = useContext(BlockRequestContextV2);
  if (showError && !context) {
    throw new Error('useBlockRequest() must be used within a BlockRequestProvider');
  }

  return context.requestResult;
};
