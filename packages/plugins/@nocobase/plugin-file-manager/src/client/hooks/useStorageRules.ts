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
import { useCollectionField, useCollectionManager, useDataSourceKey, useRequest } from '@nocobase/client';
import { useStorageUploadProps } from './useStorageUploadProps';

function appendUploadDataSourceKey(url: string, dataSourceKey?: string) {
  if (!dataSourceKey || dataSourceKey === 'main') {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}uploadDataSourceKey=${encodeURIComponent(dataSourceKey)}`;
}

export function useStorageRules(storage) {
  const name = storage ?? '';
  const dataSourceKey = useDataSourceKey();
  const field = useField<any>();
  const { loading, data, run } = useRequest<any>(
    {
      url: appendUploadDataSourceKey(`storages:getBasicInfo/${name}`, dataSourceKey),
    },
    {
      manual: true,
      refreshDeps: [name, dataSourceKey],
      cacheKey: `${dataSourceKey || 'main'}:storages:getBasicInfo/${name}`,
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
  const dataSourceKey = useDataSourceKey();
  const action = `${field?.target}:create${
    field?.storage ? `?attachmentField=${field.collectionName}.${field.name}` : ''
  }`;
  const storageUploadProps = useStorageUploadProps({ action });
  return {
    action,
    fileCollection: field?.target
      ? {
          dataSourceKey: dataSourceKey || 'main',
          collectionName: field.target,
        }
      : undefined,
    ...storageUploadProps,
  };
}

export function useFileCollectionStorageRules() {
  const field = useCollectionField();
  const collectionManager = useCollectionManager();
  const collection = collectionManager.getCollection(field?.target);
  return useStorageRules(collection?.getOption('storage'));
}
