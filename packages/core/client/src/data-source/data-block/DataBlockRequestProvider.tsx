/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, createContext, useContext, useMemo } from 'react';

import _ from 'lodash';
import { UseRequestResult, useAPIClient, useRequest } from '../../api-client';
import { useDataLoadingMode } from '../../modules/blocks/data-blocks/details-multi/setDataLoadingModeSettingsItem';
import { useSourceKey } from '../../modules/blocks/useSourceKey';
import { CollectionRecord, CollectionRecordProvider } from '../collection-record';
import { useDataSourceHeaders } from '../utils';
import { AllDataBlockProps, useDataBlockProps } from './DataBlockProvider';
import { useDataBlockResource } from './DataBlockResourceProvider';

export const BlockRequestContext = createContext<UseRequestResult<any>>(null);
BlockRequestContext.displayName = 'BlockRequestContext';

function useCurrentRequest<T>(options: Omit<AllDataBlockProps, 'type'>) {
  const dataLoadingMode = useDataLoadingMode();
  const resource = useDataBlockResource();
  const { action, params = {}, record, requestService, requestOptions } = options;

  const service = useMemo(() => {
    return requestService
      ? requestService
      : (customParams) => {
          if (record) return Promise.resolve({ data: record });
          if (!action) {
            throw new Error(
              `[nocobase]: The 'action' parameter is missing in the 'DataBlockRequestProvider' component`,
            );
          }
          const paramsValue = params.filterByTk === undefined ? _.omit(params, 'filterByTk') : params;

          return resource[action]?.({ ...paramsValue, ...customParams }).then((res) => res.data);
        };
  }, [resource, action, JSON.stringify(params), JSON.stringify(record), requestService]);

  const request = useRequest<T>(service, {
    ...requestOptions,
    manual: dataLoadingMode === 'manual',
    ready: !!action,
    refreshDeps: [action, JSON.stringify(params), JSON.stringify(record), resource],
  });

  return request;
}

export async function requestParentRecordData({
  sourceId,
  association,
  parentRecord,
  api,
  headers,
  sourceKey,
}: {
  sourceId?: number;
  association?: string;
  parentRecord?: any;
  api?: any;
  headers?: any;
  sourceKey?: string;
}) {
  if (parentRecord) return Promise.resolve({ data: parentRecord });
  if (!association || !sourceKey || !sourceId) return Promise.resolve({ data: undefined });
  // "association": "Collection.Field"
  const arr = association.split('.');
  // <collection>:get?filter[filterKey]=sourceId
  const url = `${arr[0]}:get?filter[${sourceKey}]=${sourceId}`;
  const res = await api.request({ url, headers });
  return res.data;
}

function useParentRequest<T>(options: Omit<AllDataBlockProps, 'type'>) {
  const { sourceId, association, parentRecord } = options;
  const api = useAPIClient();
  const dataBlockProps = useDataBlockProps();
  const headers = useDataSourceHeaders(dataBlockProps.dataSource);
  const sourceKey = useSourceKey(association);
  return useRequest<T>(
    () => {
      return requestParentRecordData({ sourceId, association, parentRecord, api, headers, sourceKey });
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
    return (
      parentRequest.data?.data &&
      new CollectionRecord({
        isNew: false,
        data:
          parentRequest.data?.data instanceof CollectionRecord
            ? parentRequest.data?.data.data
            : parentRequest.data?.data,
      })
    );
  }, [parentRequest.data?.data]);

  return (
    <BlockRequestContext.Provider value={currentRequest}>
      {action !== 'list' ? (
        <CollectionRecordProvider
          isNew={action == null}
          record={currentRequest.data?.data || record}
          parentRecord={memoizedParentRecord || parentRecord}
        >
          {children}
        </CollectionRecordProvider>
      ) : (
        <CollectionRecordProvider isNew={false} record={null} parentRecord={memoizedParentRecord || parentRecord}>
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
