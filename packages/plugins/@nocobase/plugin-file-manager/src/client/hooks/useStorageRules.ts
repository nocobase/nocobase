/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect } from 'react';
import { useField } from '@formily/react';
import { useAPIClient, useCollectionField, useCollectionManager, useRequest } from '@nocobase/client';
import { useStorageUploadProps } from './useStorageUploadProps';

export function useStorageRules(storage) {
  const name = storage ?? '';
  const apiClient = useAPIClient();
  const field = useField<any>();
  const { loading, data, run } = useRequest<any>(
    {
      url: `storages:getBasicInfo/${name}`,
    },
    {
      manual: true,
      refreshDeps: [name],
      cacheKey: name,
    },
  );
  useEffect(() => {
    if (field.pattern !== 'editable') {
      return;
    }
    run();
  }, [field.pattern, run]);
  return (!loading && data?.data?.rules) || null;
}

export function useAttachmentFieldProps() {
  const field = useCollectionField();
  const action = `${field?.target}:create${
    field?.storage ? `?attachmentField=${field.collectionName}.${field.name}` : ''
  }`;
  const storageUploadProps = useStorageUploadProps({ action });
  return { action, ...storageUploadProps };
}

export function useFileCollectionStorageRules() {
  const field = useCollectionField();
  const collectionManager = useCollectionManager();
  const collection = collectionManager.getCollection(field?.target);
  return useStorageRules(collection?.getOption('storage'));
}
