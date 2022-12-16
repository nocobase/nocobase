import {
  CollectionManagerProvider,
  registerField,
  SchemaComponentOptions,
  SchemaInitializerContext,
  SchemaInitializerProvider,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { snapshot } from './interface';
import { SnapshotRecordPicker } from './SnapshotRecordPicker';
import { SnapshotBlockInitializers } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializers';
import { useSnapshotTranslation } from './locale';
import { SnapshotBlockInitializersDetailItem } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializersDetailItem';
import { SnapshotBlockProvider } from './SnapshotBlock/SnapshotBlockProvider';

registerField(snapshot.group, snapshot.name as string, snapshot);

export default React.memo((props) => {
  const t = useSnapshotTranslation();
  const initializers = useContext(SchemaInitializerContext);
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
