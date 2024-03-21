import { useDeepCompareEffect, useUpdateEffect } from 'ahooks';
import React, { FC, createContext, useContext, useMemo } from 'react';

import { UseRequestResult, useAPIClient, useRequest } from '../../api-client';
import { CollectionRecordProvider, CollectionRecord } from '../collection-record';
import { AllDataBlockProps, useDataBlockProps } from './DataBlockProvider';
import { useDataBlockResource } from './DataBlockResourceProvider';
import { useDataSourceHeaders } from '../utils';
import { useDataLoadingMode } from '../../modules/blocks/data-blocks/details-multi/setDataLoadingModeSettingsItem';

export const BlockRequestContext = createContext<UseRequestResult<any>>(null);
BlockRequestContext.displayName = 'BlockRequestContext';

function useCurrentRequest<T>(options: Omit<AllDataBlockProps, 'type'>) {
  const dataLoadingMode = useDataLoadingMode();
  const resource = useDataBlockResource();
  const { action, params = {}, record, requestService, requestOptions } = options;
  if (params.filterByTk === undefined) {
    delete params.filterByTk;
  }
  const request = useRequest<T>(
    requestService
      ? requestService
      : (customParams) => {
          if (record) return Promise.resolve({ data: record });
          if (!action) {
            throw new Error(
              `[nocobase]: The 'action' parameter is missing in the 'DataBlockRequestProvider' component`,
            );
          }
          return resource[action]({ ...params, ...customParams }).then((res) => res.data);
        },
    {
      ...requestOptions,
      manual: true,
    },
  );

  // 因为修改 Schema 会导致 params 对象发生变化，所以这里使用 `DeepCompare`
  useDeepCompareEffect(() => {
    if (action && dataLoadingMode === 'auto') {
      request.run();
    }
  }, [params, action, record]);

  useUpdateEffect(() => {
    if (action && dataLoadingMode === 'auto') {
      request.run();
    }
  }, [resource]);

  return request;
}

function useParentRequest<T>(options: Omit<AllDataBlockProps, 'type'>) {
  const { sourceId, association, parentRecord } = options;
  const api = useAPIClient();
  const dataBlockProps = useDataBlockProps();
  const headers = useDataSourceHeaders(dataBlockProps.dataSource);
  return useRequest<T>(
    async () => {
      if (parentRecord) return Promise.resolve({ data: parentRecord });
      if (!association) return Promise.resolve({ data: undefined });
      // "association": "Collection.Field"
      const arr = association.split('.');
      // <collection>:get/<filterByTk>
      const url = `${arr[0]}:get/${sourceId}`;
      const res = await api.request({ url, headers });
      return res.data;
    },
    {
      refreshDeps: [association, parentRecord, sourceId],
    },
  );
}

export const BlockRequestProvider: FC = ({ children }) => {
  const props = useDataBlockProps();
  const {
    action,
    filterByTk,
    sourceId,
    params = {},
    association,
    collection,
    record,
    parentRecord,
    requestOptions,
    requestService,
  } = props;
  const currentRequest = useCurrentRequest<{ data: any }>({
    action,
    sourceId,
    record,
    association,
    collection,
    requestOptions,
    requestService,
    params: {
      ...params,
      filterByTk: filterByTk || params.filterByTk,
    },
  });

  const parentRequest = useParentRequest<{ data: any }>({
    sourceId,
    association,
    parentRecord,
  });

  const memoizedParentRecord = useMemo(() => {
    return parentRequest.data?.data && new CollectionRecord({ isNew: false, data: parentRequest.data?.data });
  }, [parentRequest.data?.data]);

  return (
    <BlockRequestContext.Provider value={currentRequest}>
      {action !== 'list' ? (
        <CollectionRecordProvider
          isNew={action == null}
          record={currentRequest.data?.data}
          parentRecord={memoizedParentRecord}
        >
          {children}
        </CollectionRecordProvider>
      ) : (
        <CollectionRecordProvider isNew={false} record={null} parentRecord={memoizedParentRecord}>
          {children}
        </CollectionRecordProvider>
      )}
    </BlockRequestContext.Provider>
  );
};

export const useDataBlockRequest = <T extends {}>(): UseRequestResult<{ data: T }> => {
  const context = useContext(BlockRequestContext);
  return context;
};
