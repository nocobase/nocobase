import React from 'react';
import { connect, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import {
  InputRecordPicker,
  ReadPrettyRecordPicker,
  useActionContext,
  useCollection,
  useCollectionManager,
} from '@nocobase/client';
import { SnapshotHistoryCollectionProvider } from './SnapshotHistoryCollectionProvider';

const useTargetCollectionKey = () => {
  const fieldSchema = useFieldSchema();
  const { getCollection } = useCollectionManager();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const targetCollection = getCollection(collectionField.target);
  return targetCollection?.key;
};

const ReadPrettyRecordPickerWrapper = (props) => {
  const collectionKey = useTargetCollectionKey();

  return (
    <SnapshotHistoryCollectionProvider collectionKey={collectionKey}>
      <ReadPrettyRecordPicker {...props} />
    </SnapshotHistoryCollectionProvider>
  );
};

const SnapshotRecordPickerInner: any = connect(
  (props) => {
    const actionCtx = useActionContext();

    const isUpdateAction = actionCtx.fieldSchema['x-action'] === 'update';

    return isUpdateAction ? <ReadPrettyRecordPickerWrapper {...props} /> : <InputRecordPicker {...props} />;
  },
  // mapProps(mapSuffixProps),
  mapReadPretty(ReadPrettyRecordPickerWrapper),
);

export const SnapshotRecordPicker = (props) => {
  const { value, onChange, ...restProps } = props;
  const collectionKey = useTargetCollectionKey();

  const newProps = {
    ...restProps,
    value: value?.data,
    onChange: (value) => onChange({ data: value, collectionKey }),
  };

  return <SnapshotRecordPickerInner {...newProps} />;
};
