import {
  CollectionHistoryProvider,
  CollectionManagerProvider,
  registerField,
  SchemaComponentOptions,
} from '@nocobase/client';
import React, { useEffect } from 'react';
import { SnapshotOwnerCollectionFieldsSelect } from './components/SnapshotOwnerCollectionFieldsSelect';
import { snapshot } from './interface';
import { SnapshotBlockInitializersDetailItem } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializersDetailItem';
import { SnapshotBlockProvider } from './SnapshotBlock/SnapshotBlockProvider';
import { SnapshotRecordPicker } from './SnapshotRecordPicker';

export const SnapshotFieldProvider = React.memo((props) => {
  useEffect(() => {
    registerField(snapshot.group, snapshot.name as string, snapshot);
  }, []);

  return (
    <CollectionManagerProvider
      interfaces={{
        snapshot,
      }}
    >
      <CollectionHistoryProvider>
        <SchemaComponentOptions
          components={{
            SnapshotRecordPicker,
            SnapshotBlockProvider,
            SnapshotBlockInitializersDetailItem,
            SnapshotOwnerCollectionFieldsSelect,
          }}
        >
          {props.children}
        </SchemaComponentOptions>
      </CollectionHistoryProvider>
    </CollectionManagerProvider>
  );
});
SnapshotFieldProvider.displayName = 'SnapshotFieldProvider';
