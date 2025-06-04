/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollection, useCollectionField, useCollectionManager, usePlugin, useRequest } from '@nocobase/client';
import { useEffect } from 'react';
import FileManagerPlugin from '../';

export function useStorage(storage) {
  const name = storage ?? '';
  const url = `storages:getBasicInfo/${name}`;
  const { loading, data, run } = useRequest<any>(
    {
      url,
    },
    {
      manual: true,
      refreshDeps: [name],
      cacheKey: url,
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
  const { storage, storageType } = useStorageCfg();
  const useStorageTypeUploadProps = storageType?.useUploadProps;
  const storageTypeUploadProps = useStorageTypeUploadProps?.({ storage, rules: storage.rules, ...props }) || {};
  return {
    rules: storage?.rules,
    ...storageTypeUploadProps,
  };
}
