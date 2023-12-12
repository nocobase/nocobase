import { useDeepCompareEffect } from 'ahooks';
import React, { FC, createContext, useContext } from 'react';

import { UseRequestResult, useAPIClient, useRequest } from '../../api-client';
import { BlockSettingsContextProps, useBlockSettingsV2 } from './BlockSettingsProvider';
import { RecordProviderV2 } from './RecordProvider';
import { useBlockResourceV2 } from './BlockResourceProvider';

export const BlockRequestContextV2 = createContext<UseRequestResult<any>>(null);
BlockRequestContextV2.displayName = 'BlockRequestContextV2';

function useCurrentRequest<T>(options: Omit<BlockSettingsContextProps, 'type'>) {
  const resource = useBlockResourceV2();
  const { action, params = {}, record } = options;
  if (params.filterByTk === undefined) {
    delete params.filterByTk;
  }
  const request = useRequest<T>(
    () => {
      if (record) return Promise.resolve({ data: record });
      if (!action) {
        throw new Error(`[nocobase]: The 'action' parameter is missing in the 'BlockRequestProvider' component`);
      }
      return resource[action](params).then((res) => res.data);
    },
    {
      manual: true,
    },
  );

  // 因为修改 Schema 会导致 params 对象发生变化，所以这里使用 `DeepCompare`
  useDeepCompareEffect(() => {
    request.run();
  }, [params, action, record]);

  return request;
}

function useParentRequest<T>(options: Omit<BlockSettingsContextProps, 'type'>) {
  const { sourceId, association, parentRecord } = options;
  const api = useAPIClient();

  return useRequest<T>(
    () => {
      if (parentRecord) return Promise.resolve({ data: parentRecord });
      if (!association) return Promise.resolve({ data: undefined });
      // "association": "Collection.Field"
      const arr = association.split('.');
      // <collection>:get/<filterByTk>
      const url = `${arr[0]}:get/${sourceId}`;
      return api.request({ url }).then((res) => res.data);
    },
    {
      refreshDeps: [association, parentRecord, sourceId],
    },
  );
}

export const BlockRequestProviderV2: FC = ({ children }) => {
  const { props } = useBlockSettingsV2();
  const { action, filterByTk, sourceId, params = {}, association, collection, record, parentRecord } = props;
  const currentRequest = useCurrentRequest<{ data: any }>({
    action,
    sourceId,
    record,
    association,
    collection,
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

  return (
    <BlockRequestContextV2.Provider value={currentRequest}>
      {action !== 'list' ? (
        <RecordProviderV2 record={currentRequest.data?.data} parentRecord={parentRequest.data?.data}>
          {children}
        </RecordProviderV2>
      ) : (
        children
      )}
    </BlockRequestContextV2.Provider>
  );
};

export const useBlockRequestV2 = <T extends {}>(showError = true): UseRequestResult<T> => {
  const context = useContext(BlockRequestContextV2);
  if (showError && !context) {
    throw new Error('useBlockRequest() must be used within a BlockRequestProvider');
  }

  return context;
};

export const useBlockRequestDataV2 = <T extends {}>(showError = true): UseRequestResult<{ data: T }> => {
  const context = useContext(BlockRequestContextV2);
  if (showError && !context) {
    throw new Error('useBlockRequest() must be used within a BlockRequestProvider');
  }

  return context.data;
};
