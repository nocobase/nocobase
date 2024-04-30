/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionHistoryProvider, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { SnapshotOwnerCollectionFieldsSelect } from './components/SnapshotOwnerCollectionFieldsSelect';
import { SnapshotBlockInitializersDetailItem } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializersDetailItem';
import { SnapshotBlockProvider } from './SnapshotBlock/SnapshotBlockProvider';
import { SnapshotRecordPicker } from './SnapshotRecordPicker';

export const SnapshotFieldProvider = React.memo((props) => {
  return (
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
  );
});
SnapshotFieldProvider.displayName = 'SnapshotFieldProvider';
