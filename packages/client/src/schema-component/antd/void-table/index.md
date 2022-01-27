---
nav:
  path: /client
group:
  path: /schema-components
---

# VoidTable - 表格（数据展示） <Badge>待定</Badge>

VoidTable 只用作数据展示，如果需要可以录入数据的表格字段，请使用 [ArrayTable](array-table)。

## Examples

VoidTable 的 props 与 antd 的 [Table](https://ant.design/components/table/#API) 一致。

### 基础使用

```tsx
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  APIClientProvider,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useAPIClient,
  VoidTable
} from '@nocobase/client';
import _ from 'lodash';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    table1: {
      type: 'void',
      'x-component': 'VoidTable',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        dataSource: _.range(5).map((v) => {
          return {
            id: v,
            name: uid(),
          };
        }),
      },
      properties: {
        column1: {
          type: 'void',
          title: 'Name',
          'x-component': 'VoidTable.Column',
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Input, VoidTable }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```

### 分页

```tsx
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  APIClientProvider,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useAPIClient,
  VoidTable
} from '@nocobase/client';
import _ from 'lodash';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    table1: {
      type: 'void',
      'x-component': 'VoidTable',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        dataSource: _.range(50).map((v) => {
          return {
            id: v,
            name: uid(),
          };
        }),
      },
      properties: {
        column1: {
          type: 'void',
          title: 'Name',
          'x-component': 'VoidTable.Column',
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Input, VoidTable }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```

### 不分页

```tsx
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  APIClientProvider,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useAPIClient,
  VoidTable
} from '@nocobase/client';
import _ from 'lodash';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    table1: {
      type: 'void',
      'x-uid': 'input',
      'x-component': 'VoidTable',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        pagination: false,
        dataSource: _.range(12).map((v) => {
          return {
            id: v,
            name: uid(),
          };
        }),
      },
      properties: {
        column1: {
          type: 'void',
          title: 'Name',
          'x-component': 'VoidTable.Column',
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Input, VoidTable }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```

### 异步数据

<code src="./demos/demo1.tsx">

为了更好的支持 columns 的渲染，添加了 VoidTable.Column 用于配置表格列，VoidTable.Column 写在 properties 里，属性与 antd 的 [Table.Column](https://ant.design/components/table/#Column) 一致。

```ts
{
  type: 'void',
  'x-component': 'VoidTable',
  'x-component-props': {
    rowKey: 'id',
    dataSource: [
      { id: 1, name: 'Name1' },
      { id: 2, name: 'Name2' },
      { id: 3, name: 'Name3' },
    ],
  },
  properties: {
    column1: {
      type: 'void',
      'x-component': 'VoidTable.Column',
      'x-component-props': {
        title: 'Name',
      },
      properties: {
        name: {
          type: 'string',
          'x-component': 'Input',
        },
      },
    },
  },
}
```
