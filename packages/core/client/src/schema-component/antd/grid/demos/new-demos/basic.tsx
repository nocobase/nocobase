/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { observer } from '@formily/reactive-react';
import { getAppComponent } from '@nocobase/test/web';
import React from 'react';
import { DragHandler } from '@nocobase/client';

const MyBlock = observer(
  () => {
    const fieldSchema = useFieldSchema();
    return (
      <div
        className="block-item"
        style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}
      >
        {fieldSchema.title}
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
    name: 'grid1',
    'x-component': 'Grid',
    properties: {
      row1: {
        type: 'void',
        'x-component': 'Grid.Row',
        properties: {
          col1: {
            type: 'void',
            'x-component': 'Grid.Col',
            properties: {
              block1: {
                type: 'void',
                title: 'row1 - col1 - block1',
                'x-decorator': 'BlockItem',
                'x-component': 'MyBlock',
              },
              block2: {
                type: 'void',
                title: 'row1 - col1 - block2',
                'x-decorator': 'BlockItem',
                'x-component': 'MyBlock',
              },
            },
          },
          col2: {
            type: 'void',
            'x-component': 'Grid.Col',
            properties: {
              block1: {
                type: 'void',
                title: 'row1 - col2 - block1',
                'x-decorator': 'BlockItem',
                'x-component': 'MyBlock',
              },
            },
          },
        },
      },
      row2: {
        type: 'void',
        'x-component': 'Grid.Row',
        properties: {
          col1: {
            type: 'void',
            'x-component': 'Grid.Col',
            properties: {
              block4: {
                type: 'void',
                title: 'row2 - col1 - block1',
                'x-decorator': 'BlockItem',
                'x-component': 'MyBlock',
              },
            },
          },
          col2: {
            type: 'void',
            'x-component': 'Grid.Col',
            properties: {
              block1: {
                type: 'void',
                title: 'row2 - col2 - block1',
                'x-decorator': 'BlockItem',
                'x-component': 'MyBlock',
              },
            },
          },
        },
      },
    },
  },
  appOptions: {
    components: {
      MyBlock,
    },
  },
});

export default App;
