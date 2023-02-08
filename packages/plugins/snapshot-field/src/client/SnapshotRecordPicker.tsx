import React from 'react';
import { connect, mapReadPretty, useFieldSchema } from '@formily/react';
import { ReadPrettyRecordPicker, useCollection, useSnapshotFieldTargetCollectionName } from '@nocobase/client';
import { SnapshotHistoryCollectionProvider } from './SnapshotHistoryCollectionProvider';

const ReadPrettyRecordPickerWrapper = (props) => {
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const collectionName = useSnapshotFieldTargetCollectionName(collectionField);

  return (
    <SnapshotHistoryCollectionProvider collectionName={collectionName}>
      <ReadPrettyRecordPicker {...props} />
    </SnapshotHistoryCollectionProvider>
  );
};

const SnapshotRecordPickerInner: any = connect(
  ReadPrettyRecordPickerWrapper,
  mapReadPretty(ReadPrettyRecordPickerWrapper),
);

export const SnapshotRecordPicker = (props) => {
  const { value, onChange, ...restProps } = props;

  const newProps = {
    ...restProps,
    value: value?.data,
    onChange: (value) => onChange({ data: value }),
  };

  return <SnapshotRecordPickerInner {...newProps} />;
};
