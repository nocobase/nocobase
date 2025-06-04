/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// @ts-ignore
import React, { FC, createContext, useContext, useDeferredValue, useMemo, useRef } from 'react';

import _ from 'lodash';
import { UseRequestResult, useAPIClient, useRequest } from '../../api-client';
import { useTemplateBlockContext } from '../../block-provider/TemplateBlockProvider';
import { useDataLoadingMode } from '../../modules/blocks/data-blocks/details-multi/setDataLoadingModeSettingsItem';
import { useSourceKey } from '../../modules/blocks/useSourceKey';
import { useKeepAlive } from '../../route-switch/antd/admin-layout/KeepAlive';
import { EMPTY_OBJECT } from '../../variables/constants';
import { CollectionRecord, CollectionRecordProvider } from '../collection-record';
import { useDataSourceHeaders } from '../utils';
import { AllDataBlockProps, useDataBlockProps } from './DataBlockProvider';
import { useDataBlockResource } from './DataBlockResourceProvider';

const BlockRequestRefContext = createContext<React.MutableRefObject<UseRequestResult<any>>>(null);
BlockRequestRefContext.displayName = 'BlockRequestRefContext';

/**
 * @internal
 */
export const BlockRequestLoadingContext = createContext<boolean>(false);
BlockRequestLoadingContext.displayName = 'BlockRequestLoadingContext';

const BlockRequestDataContext = createContext<any>(null);
BlockRequestDataContext.displayName = 'BlockRequestDataContext';

function useRecordRequest<T>(options: Omit<AllDataBlockProps, 'type'>) {
  const dataLoadingMode = useDataLoadingMode();
  const resource = useDataBlockResource();
  const { action, params = {}, record, requestService, requestOptions, sourceId, association, parentRecord } = options;
  const api = useAPIClient();
  const dataBlockProps = useDataBlockProps();
  const headers = useDataSourceHeaders(dataBlockProps.dataSource);
  const sourceKey = useSourceKey(association);
  const [JSONParams, JSONRecord] = useMemo(() => [JSON.stringify(params), JSON.stringify(record)], [params, record]);
  const { isBlockTemplate, templateFinished } = useTemplateBlockContext();

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
    const mergedParams = { ...paramsValue, ...customParams };
    return resource[action]?.(mergedParams).then((res) => res.data);
  };

  const requestFunction = (...arg) => {
    // 防止区块模板请求两次接口
    if (isBlockTemplate?.() && !templateFinished) {
      return null;
    }

    return (requestService || defaultService)(...arg);
  };

  const service = async (...arg) => {
    const [currentRecordData, parentRecordData] = await Promise.all([
      requestFunction(...arg),
      requestParentRecordData({ sourceId, association, parentRecord, api, headers, sourceKey }),
    ]);

    if (currentRecordData) {
      currentRecordData.parentRecord = parentRecordData?.data;
    }

    return currentRecordData;
  };

  const request = useRequest<T>(service, {
    ...requestOptions,
    manual: dataLoadingMode === 'manual',
    ready: !!action,
    refreshDeps: [action, JSONParams, JSONRecord, resource, association, parentRecord, sourceId, templateFinished],
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

export const BlockRequestContextProvider: FC<{ recordRequest: UseRequestResult<any> }> = (props) => {
  const recordRequestRef = useRef<UseRequestResult<any>>(props.recordRequest);
  const prevRequestDataRef = useRef<any>(props.recordRequest?.data);
  const { active: pageActive } = useKeepAlive();
  const prevPageActiveRef = useRef(pageActive);
  // Prevent page switching lag
  const deferredPageActive = useDeferredValue(pageActive);
  const blockProps = useDataBlockProps();

  if (
    deferredPageActive &&
    !prevPageActiveRef.current &&
    (_.isNil(blockProps.dataLoadingMode) || blockProps.dataLoadingMode === 'auto')
  ) {
    props.recordRequest?.refresh();
  }

  // Only reassign values when props.recordRequest?.data changes to reduce unnecessary re-renders
  if (
    deferredPageActive &&
    // the stage when loading just ended
    prevPageActiveRef.current &&
    !props.recordRequest?.loading &&
    !_.isEqual(prevRequestDataRef.current, props.recordRequest?.data)
  ) {
    prevRequestDataRef.current = props.recordRequest?.data;
  }

  if (deferredPageActive !== prevPageActiveRef.current) {
    prevPageActiveRef.current = deferredPageActive;
  }

  recordRequestRef.current = props.recordRequest;

  return (
    <BlockRequestRefContext.Provider value={recordRequestRef}>
      <BlockRequestLoadingContext.Provider value={props.recordRequest?.loading}>
        <BlockRequestDataContext.Provider value={prevRequestDataRef.current}>
          {props.children}
        </BlockRequestDataContext.Provider>
      </BlockRequestLoadingContext.Provider>
    </BlockRequestRefContext.Provider>
  );
};

export const BlockRequestProvider: FC = React.memo(({ children }) => {
  const props = useDataBlockProps();
  const {
    action,
    filterByTk,
    sourceId,
    params = EMPTY_OBJECT,
    association,
    collection,
    record,
    parentRecord,
    requestOptions,
    requestService,
  } = props;

  const _params = useMemo(
    () => ({
      ...params,
      filterByTk: filterByTk || params.filterByTk,
    }),
    [filterByTk, params],
  );

  const recordRequest = useRecordRequest<{ data: any; parentRecord: any }>({
    action,
    sourceId,
    record,
    association,
    collection,
    requestOptions,
    requestService,
    params: _params,
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
    <BlockRequestContextProvider recordRequest={recordRequest}>
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
    </BlockRequestContextProvider>
  );
});

BlockRequestProvider.displayName = 'DataBlockRequestProvider';

export const useDataBlockRequest = <T extends {}>(): UseRequestResult<{ data: T }> => {
  const contextRef = useContext(BlockRequestRefContext);
  const loading = useContext(BlockRequestLoadingContext);
  const data = useContext(BlockRequestDataContext);
  return useMemo(() => (contextRef ? { ...contextRef.current, loading, data } : null), [contextRef, data, loading]);
};

/**
 * Compared to `useDataBlockRequest`, this Hook helps prevent unnecessary re-renders.
 *
 * This Hook returns a stable function reference that won't change between renders. When you only need
 * methods like `refresh` or `run`, using this Hook is recommended because:
 *
 * 1. It returns a memoized object containing only the getter function
 * 2. The getter function accesses the latest request data through a ref, avoiding re-renders
 * 3. Unlike useDataBlockRequest which returns request state directly, this Hook provides indirect access
 *    through a getter, breaking the reactive dependency chain
 *
 * For example:
 * ```ts
 * // This will re-render when request state changes
 * const { refresh } = useDataBlockRequest();
 *
 * // This won't re-render when request state changes
 * const { getDataBlockRequest } = useDataBlockRequestGetter();
 * const refresh = getDataBlockRequest().refresh;
 * ```
 *
 * @returns An object containing the getDataBlockRequest method that provides access to the request instance
 */
export const useDataBlockRequestGetter = () => {
  const contextRef = useContext(BlockRequestRefContext);
  return useMemo(
    () => ({
      getDataBlockRequest: () => (contextRef ? contextRef.current : null),
    }),
    [contextRef],
  );
};

/**
 * When only data is needed, it's recommended to use this hook to avoid unnecessary re-renders
 */
export const useDataBlockRequestData = () => {
  return useContext(BlockRequestDataContext);
};
