import React from 'react';
import { connect, mapReadPretty, useFieldSchema } from '@formily/react';
import {
  InputRecordPicker,
  ReadPrettyRecordPicker,
  useActionContext,
  useCollection,
  useCollectionHistory,
} from '@nocobase/client';
import { SnapshotHistoryCollectionProvider } from './SnapshotHistoryCollectionProvider';

const useSnapshotFieldTargetCollectionKey = () => {
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const { historyCollections } = useCollectionHistory();
  return historyCollections.find((i) => i.name === collectionField.target)?.key;
};

const ReadPrettyRecordPickerWrapper = (props) => {
  const collectionKey = useSnapshotFieldTargetCollectionKey();

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
  const collectionKey = useSnapshotFieldTargetCollectionKey();

  const newProps = {
    ...restProps,
    value: value?.data,
    onChange: (value) => onChange({ data: value, collectionKey }),
  };

  return <SnapshotRecordPickerInner {...newProps} />;
};
