/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  RecordPickerContext,
  useActionContext,
  useBlockRequestContext,
  useCollection,
  useSourceIdFromParentRecord,
} from '@nocobase/client';
import { useContext, useMemo } from 'react';
import { useStorageRules } from './useStorageRules';

export const useUploadFiles = () => {
  const { service } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  const { props: blockProps } = useBlockRequestContext();
  const collection = useCollection();
  const sourceId = useSourceIdFromParentRecord();
  const rules = useStorageRules(collection?.getOption('storage'));
  const action = useMemo(() => {
    let action = `${collection.name}:create`;
    if (blockProps?.association) {
      const [s, t] = blockProps.association.split('.');
      action = `${s}/${sourceId}/${t}:create`;
    }
    return action;
  }, [collection.name, blockProps?.association, sourceId]);
  const { setSelectedRows } = useContext(RecordPickerContext) || {};
  const uploadingFiles = {};

  let pendingNumber = 0;

  return {
    action,
    onChange(fileList) {
      fileList.forEach((file) => {
        if (file.status === 'uploading' && !uploadingFiles[file.uid]) {
          pendingNumber++;
          uploadingFiles[file.uid] = true;
        }
        if (file.status !== 'uploading' && uploadingFiles[file.uid]) {
          delete uploadingFiles[file.uid];
          if (--pendingNumber === 0) {
            service?.refresh?.();
            setSelectedRows?.((preRows) => [
              ...preRows,
              ...fileList.filter((file) => file.status === 'done').map((file) => file.response.data),
            ]);
          }
        }
      });

      if (fileList.every((file) => file.status === 'done')) {
        setVisible(false);
      }
    },
    rules,
  };
};
