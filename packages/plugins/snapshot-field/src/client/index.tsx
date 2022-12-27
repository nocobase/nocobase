import {
  CollectionManagerProvider,
  registerField,
  SchemaComponentOptions,
  SchemaInitializerContext,
  SchemaInitializerProvider,
} from '@nocobase/client';
import React, { useContext, useState, useEffect } from 'react';
import { useSnapshotInterface } from './interface';
import { SnapshotRecordPicker } from './SnapshotRecordPicker';
import { SnapshotBlockInitializers } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializers';
import { useSnapshotTranslation } from './locale';
import { SnapshotBlockInitializersDetailItem } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializersDetailItem';
import { SnapshotBlockProvider } from './SnapshotBlock/SnapshotBlockProvider';

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
          }}
        >
          {props.children}
        </SchemaComponentOptions>
      </SchemaInitializerProvider>
    </CollectionManagerProvider>
  );
});
