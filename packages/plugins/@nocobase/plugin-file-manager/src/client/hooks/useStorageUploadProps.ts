/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  useCollection,
  useCollectionField,
  useCollectionManager,
  useDataSourceKey,
  usePlugin,
  useRequest,
} from '@nocobase/client';
import { useEffect } from 'react';
import FileManagerPlugin from '../';

function appendUploadDataSourceKey(url: string, dataSourceKey?: string) {
  if (!dataSourceKey || dataSourceKey === 'main') {
    return url;
  }

  const [path, search] = url.split('?');
  const params = new URLSearchParams(search);
  params.set('uploadDataSourceKey', dataSourceKey);
  return `${path}?${params.toString()}`;
}

function getUploadDataSourceHeaders(dataSourceKey?: string) {
  return dataSourceKey && dataSourceKey !== 'main' ? { 'X-Data-Source': dataSourceKey } : {};
}

export function useStorage(storage) {
  const name = storage ?? '';
  const dataSourceKey = useDataSourceKey();
  const url = appendUploadDataSourceKey(`storages:getBasicInfo/${name}`, dataSourceKey);
  const { loading, data, run } = useRequest<any>(
    {
      url,
    },
    {
      manual: true,
      refreshDeps: [name, dataSourceKey],
      cacheKey: `${dataSourceKey || 'main'}:${url}`,
    },
  );
  useEffect(() => {
    run();
  }, [run]);
  return (!loading && data?.data) || null;
}

export function useStorageCfg() {
  const field = useCollectionField();
  const cm = useCollectionManager();
  const targetCollection = cm.getCollection(field?.target);
  const collection = useCollection();
  const plugin = usePlugin(FileManagerPlugin);
  const storage = useStorage(
    field?.storage || collection?.getOption('storage') || targetCollection?.getOption('storage'),
  );
  const storageType = plugin.getStorageType(storage?.type);
  return {
    storage,
    storageType,
  };
}
export function useStorageUploadProps(props) {
  const dataSourceKey = useDataSourceKey();
  const { storage, storageType } = useStorageCfg();
  const useStorageTypeUploadProps = storageType?.useUploadProps;
  const action = appendUploadDataSourceKey(props.action, dataSourceKey);
  const dataSourceHeaders = getUploadDataSourceHeaders(dataSourceKey);
  const storageTypeUploadProps =
    useStorageTypeUploadProps?.({
      storage,
      rules: storage.rules,
      ...props,
      action,
      dataSourceKey,
      headers: {
        ...props.headers,
        ...dataSourceHeaders,
      },
    }) || {};
  const headers = {
    ...storageTypeUploadProps.headers,
    ...dataSourceHeaders,
  };

  return {
    rules: storage?.rules,
    ...storageTypeUploadProps,
    action: appendUploadDataSourceKey(storageTypeUploadProps.action || action, dataSourceKey),
    headers,
  };
}
