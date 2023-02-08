import {
  CollectionHistoryProvider,
  CollectionManagerProvider,
  registerField,
  SchemaComponentOptions,
  SchemaInitializerContext,
  SchemaInitializerProvider,
} from '@nocobase/client';
import React, { useContext, useEffect } from 'react';
import { useSnapshotInterface, useSnapshotOwnerCollectionFields } from './interface';
import { SnapshotRecordPicker } from './SnapshotRecordPicker';
import { SnapshotBlockInitializers } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializers';
import { SnapshotBlockInitializersDetailItem } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializersDetailItem';
import { SnapshotBlockProvider } from './SnapshotBlock/SnapshotBlockProvider';
import { AppendsTreeSelect } from './components/AppendsTreeSelect';

export default React.memo((props) => {
  const initializers = useContext(SchemaInitializerContext);
  const snapshot = useSnapshotInterface();

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
        <SchemaInitializerProvider
          initializers={{
            ...initializers,
            SnapshotBlockInitializers,
          }}
        >
          <SchemaComponentOptions
            components={{
              SnapshotRecordPicker,
              SnapshotBlockProvider,
              SnapshotBlockInitializersDetailItem,
              AppendsTreeSelect,
            }}
            scope={{
              useSnapshotOwnerCollectionFields,
            }}
          >
            {props.children}
          </SchemaComponentOptions>
        </SchemaInitializerProvider>
      </CollectionHistoryProvider>
    </CollectionManagerProvider>
  );
});
