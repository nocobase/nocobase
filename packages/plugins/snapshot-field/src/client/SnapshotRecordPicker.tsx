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

const SnapshotRecordPickerInner: any = connect(
  (props) => {
    const actionCtx = useActionContext();

    const isUpdateAction = actionCtx.fieldSchema['x-action'] === 'update';

    return isUpdateAction ? <ReadPrettyRecordPicker {...props} /> : <InputRecordPicker {...props} />;
  },
  // mapProps(mapSuffixProps),
  mapReadPretty(ReadPrettyRecordPicker),
);

export const SnapshotRecordPicker = (props) => {
  const { value, onChange, ...restProps } = props;
  const fieldSchema = useFieldSchema();
  const { getCollection } = useCollectionManager();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const targetCollection = getCollection(collectionField.target);
  const collectionKey = targetCollection?.key;

  const newProps = {
    ...restProps,
    value: value?.data,
    onChange: (value) => onChange({ data: value, collectionKey }),
  };

  return (
    <SnapshotHistoryCollectionProvider collectionKey={collectionKey}>
      <SnapshotRecordPickerInner {...newProps} />
    </SnapshotHistoryCollectionProvider>
  );
};
