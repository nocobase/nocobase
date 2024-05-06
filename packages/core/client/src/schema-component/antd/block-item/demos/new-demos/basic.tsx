/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAppComponent } from '@nocobase/test/web';
import { DragHandler, SchemaSettings } from '@nocobase/client';
import { useFieldSchema } from '@formily/react';
import { observer } from '@formily/reactive-react';
import React from 'react';

const simpleSettings = new SchemaSettings({
  name: 'simpleSettings',
  items: [
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});

const MyBlock = observer(
  () => {
    const fieldSchema = useFieldSchema();
    return (
      <div
        className="nc-block-item"
        style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}
      >
        {fieldSchema.name}
        <DragHandler />
      </div>
    );
  },
  { displayName: 'MyBlock' },
);

const App = getAppComponent({
  designable: true,
  schema: {
    type: 'void',
    name: 'root',
    'x-component': 'DndContext',
    properties: {
      block1: {
        type: 'void',
        'x-decorator': 'BlockItem',
        'x-component': 'MyBlock',
        'x-settings': 'simpleSettings',
      },
      block2: {
        type: 'void',
        'x-decorator': 'BlockItem',
        'x-component': 'MyBlock',
        'x-settings': 'simpleSettings',
      },
      block3: {
        type: 'void',
        'x-decorator': 'BlockItem',
        'x-component': 'MyBlock',
        'x-settings': 'simpleSettings',
      },
    },
  },
  appOptions: {
    schemaSettings: [simpleSettings],
    components: {
      MyBlock,
    },
  },
});

export default App;
