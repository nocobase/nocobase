/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollectionField, useCollectionManager } from '@nocobase/client';
import { useStorage, useStorageUploadProps } from './useStorageUploadProps';

export function useStorageRules(storage: string) {
  return useStorage(storage)?.rules || null;
}

export function useAttachmentFieldProps() {
  const field = useCollectionField();
  const action = `${field.target}:create${
    field.storage ? `?attachmentField=${field.collectionName}.${field.name}` : ''
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
