import {
  CollectionManagerProvider,
  SchemaComponentOptions,
  SchemaInitializerContext,
  SchemaInitializerProvider,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { snapshot } from './interface';
import { SnapshotRecordPicker } from './SnapshotRecordPicker';
import { SnapshotField } from './SnapshotField';
import { SnapshotBlockInitializers } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializers';
import { useSnapshotTranslation } from './locale';
import { SnapshotBlockInitializersDetailItem } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializersDetailItem';
import { SnapshotBlockProvider } from './SnapshotBlock/SnapshotBlockProvider';

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
            SnapshotField,
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
