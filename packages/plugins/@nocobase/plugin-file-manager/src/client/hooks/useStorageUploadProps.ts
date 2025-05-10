/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollection, useCollectionField, useCollectionManager, usePlugin } from '@nocobase/client';

import FileManagerPlugin from '../';
import { useFileManagerContext } from '../FileManagerProvider';

export function useStorage(storage: string) {
  const { storages } = useFileManagerContext();
  const name = storage ?? '';
  const isNumber = /^\d+$/.test(name);
  const result = storages.find((item) => {
    if (isNumber) {
      return item.id === Number.parseInt(name, 10);
    } else if (name) {
      return item.name === name;
    } else {
      return item.default;
    }
  });

  return result;
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
