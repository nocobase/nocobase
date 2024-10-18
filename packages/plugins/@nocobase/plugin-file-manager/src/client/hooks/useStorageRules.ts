/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField } from '@formily/react';
import { useAPIClient, useCollectionField, useCollectionManager, useRequest } from '@nocobase/client';

export function useStorageRules(storage) {
  const name = storage ?? '';
  const apiClient = useAPIClient();
  const field = useField<any>();
  const { loading, data } = useRequest<any>(
    async () => {
      if (field.pattern !== 'editable') {
        return null;
      }
      return apiClient.request({
        url: `storages:getRules/${name}`,
      });
    },
    {
      refreshDeps: [name],
      cacheKey: name,
    },
  );
  return (!loading && data?.data) || null;
}

export function useAttachmentFieldProps() {
  const field = useCollectionField();
  const rules = useStorageRules(field?.storage);

  return {
    rules,
    action: `${field.target}:create${field.storage ? `?attachmentField=${field.collectionName}.${field.name}` : ''}`,
  };
}

export function useFileCollectionStorageRules() {
  const field = useCollectionField();
  const collectionManager = useCollectionManager();
  const collection = collectionManager.getCollection(field?.target);
  return useStorageRules(collection?.getOption('storage'));
}
