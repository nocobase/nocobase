/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollectionField, useCollectionManager, useRequest } from '@nocobase/client';

export function useStorageRules(name = '') {
  const { loading, data } = useRequest<any>(
    {
      url: `storages:getRules/${name}`,
    },
    {
      refreshDeps: [name],
    },
  );
  return (!loading && data?.data) || null;
}

export function useCollectionFieldStorageRules() {
  const field = useCollectionField();
  const rules = useStorageRules(field?.storage);
  return { rules };
}

export function useFileCollectionStorageRules() {
  const field = useCollectionField();
  const collectionManager = useCollectionManager();
  const collection = collectionManager.getCollection(field?.target);
  return useStorageRules(collection?.getOption('storage'));
}
