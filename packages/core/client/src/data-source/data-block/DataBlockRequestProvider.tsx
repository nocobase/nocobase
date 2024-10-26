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

function useRecordRequest<T>(options: Omit<AllDataBlockProps, 'type'>) {
  const dataLoadingMode = useDataLoadingMode();
  const resource = useDataBlockResource();
  const { action, params = {}, record, requestService, requestOptions, sourceId, association, parentRecord } = options;
  const api = useAPIClient();
  const dataBlockProps = useDataBlockProps();
  const headers = useDataSourceHeaders(dataBlockProps.dataSource);
  const sourceKey = useSourceKey(association);
  const JSONParams = JSON.stringify(params);
  const JSONRecord = JSON.stringify(record);

  const defaultService = (customParams) => {
    if (record) return Promise.resolve({ data: record });
    if (!action) {
      throw new Error(`[nocobase]: The 'action' parameter is missing in the 'DataBlockRequestProvider' component`);
    }

    // fix https://nocobase.height.app/T-4876/description
    if (action === 'get' && _.isNil(params.filterByTk)) {
      return console.warn(
        '[nocobase]: The "filterByTk" parameter is missing in the "DataBlockRequestProvider" component',
      );
    }

    const paramsValue = params.filterByTk === undefined ? _.omit(params, 'filterByTk') : params;

    return resource[action]?.({ ...paramsValue, ...customParams }).then((res) => res.data);
  };

  const service = async (...arg) => {
    const [currentRecordData, parentRecordData] = await Promise.all([
      (requestService || defaultService)(...arg),
      requestParentRecordData({ sourceId, association, parentRecord, api, headers, sourceKey }),
    ]);

    currentRecordData.parentRecord = parentRecordData?.data;

    return currentRecordData;
  };

  const request = useRequest<T>(service, {
    ...requestOptions,
    manual: dataLoadingMode === 'manual',
    ready: !!action,
    refreshDeps: [action, JSONParams, JSONRecord, resource, association, parentRecord, sourceId],
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

  const recordRequest = useRecordRequest<{ data: any; parentRecord: any }>({
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
    parentRecord,
  });

  const parentRecordData = recordRequest.data?.parentRecord;

  const memoizedParentRecord = useMemo(() => {
    return (
      parentRecordData &&
      new CollectionRecord({
        isNew: false,
        data: parentRecordData instanceof CollectionRecord ? parentRecordData.data : parentRecordData,
      })
    );
  }, [parentRecordData]);

  return (
    <BlockRequestContext.Provider value={recordRequest}>
      {action !== 'list' ? (
        <CollectionRecordProvider
          isNew={action == null}
          record={recordRequest.data?.data || record}
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
