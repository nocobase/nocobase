import { connect, mapReadPretty, useFieldSchema } from '@formily/react';
import { ReadPrettyRecordPicker, useCollection_deprecated } from '@nocobase/client';
import React from 'react';
import { SnapshotHistoryCollectionProvider } from './SnapshotHistoryCollectionProvider';

const ReadPrettyRecordPickerWrapper = (props) => {
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection_deprecated();
  const collectionField = getField(fieldSchema.name);

  return (
    <SnapshotHistoryCollectionProvider collectionName={collectionField?.targetCollection}>
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
