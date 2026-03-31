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
  useCollection,
  useDataBlockProps,
  useDataBlockRequestGetter,
  useSourceId,
} from '@nocobase/client';
import { useContext, useMemo } from 'react';
import { useStorageUploadProps } from './useStorageUploadProps';

export const useUploadFiles = () => {
  const { getDataBlockRequest } = useDataBlockRequestGetter();
  const { association } = useDataBlockProps() || {};
  const { setVisible } = useActionContext();
  const collection = useCollection();
  const sourceId = useSourceId();
  const action = useMemo(() => {
    let action = `${collection.name}:create`;
    if (association) {
      const [s, t] = association.split('.');
      action = `${s}/${sourceId}/${t}:create`;
    }
    return action;
  }, [collection.name, association, sourceId]);
  const { setSelectedRows } = useContext(RecordPickerContext) || {};
  const uploadingFiles = {};

  let pendingNumber = 0;

  const uploadProps = {
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
            getDataBlockRequest()?.refresh?.();
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
  };

  const storageUploadProps = useStorageUploadProps(uploadProps);
  return {
    ...uploadProps,
    ...storageUploadProps,
  };
};
