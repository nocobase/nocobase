import {
  RecordPickerContext,
  useActionContext,
  useBlockRequestContext,
  useCollection,
  useSourceIdFromParentRecord,
} from '@nocobase/client';
import { useContext, useMemo } from 'react';
import { useFileCollectionStorageRules } from './useStorageRules';

export const useUploadFiles = () => {
  const { service } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  const { props: blockProps } = useBlockRequestContext();
  const collection = useCollection();
  const sourceId = useSourceIdFromParentRecord();
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
    useRules: useFileCollectionStorageRules,
  };
};
