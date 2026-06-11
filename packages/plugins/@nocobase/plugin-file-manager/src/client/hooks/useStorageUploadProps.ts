/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  getDataSourceHeaders,
  useCollection,
  useCollectionField,
  useCollectionManager,
  useDataSourceKey,
  usePlugin,
  useRequest,
} from '@nocobase/client';
import { useEffect } from 'react';
import FileManagerPlugin from '../';

export function useStorage(storage) {
  const name = storage ?? '';
  const url = `storages:getBasicInfo/${name}`;
  const dataSourceKey = useDataSourceKey();
  const headers = getDataSourceHeaders(dataSourceKey);
  const { loading, data, run } = useRequest<any>(
    {
      url,
      headers,
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
  const storageTypeUploadProps = useStorageTypeUploadProps?.({ storage, rules: storage.rules, ...props }) || {};
  const headers = {
    ...getDataSourceHeaders(dataSourceKey),
    ...storageTypeUploadProps.headers,
  };

  return {
    rules: storage?.rules,
    ...storageTypeUploadProps,
    headers,
  };
}
