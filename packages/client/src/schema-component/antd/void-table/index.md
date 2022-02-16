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

### CollectionProvider + ResourceActionProvider

<code src="./demos/demo2.tsx">

大纲

```tsx | pure
<CollectionProvider> {/* 属于哪个 collection */}
  <ResourceActionProvider> {/* 发起请求，将请求结果存到上下文共享给子组件 */}
    <SettingsForm /> {/* 区块的配置表单 */}
    <ActionBar /> {/* 操作区 */}
    <Table/> {/* 具体的组件，如 Table、Form、Calendar 等 */}
  </ResourceActionProvider>
</CollectionProvider>
```

通过 CollectionProvider 和 ResourceActionProvider 来解决数据区块配置和数据请求，与具体组件无关，所有区块通用。在里面可以放任意东西。

嵌套使用的情况

```tsx | pure
<CollectionProvider> {/* 属于哪个 collection */}
  <ResourceActionProvider> {/* 发起请求，将请求结果存到上下文共享给子组件 */}
    <SettingsForm /> {/* 区块的配置表单 */}
    <ActionBar /> {/* 操作区 */}
    <Table> {/* 具体的组件 */}
      <Table.Column>
        <SettingsForm /> {/* 表格列的配置表单 */}
        <RecordProvider> {/* 列表数据的行记录 */}
          <CollectionField>
            <CollectionFieldProvider> {/* 是哪个字段 */}
              <CollectionProvider> {/* 关联字段的关联表 collection */}
                <ResourceActionProvider> {/* 可能也会发起请求，如查看详情 */}
                  <SettingsForm />
                  <ActionBar />
                  <Table />
                </ResourceActionProvider>
              </CollectionProvider>
            </CollectionFieldProvider>
          </CollectionField>
        </RecordProvider>
      </Table.Column>
      <Table.Column></Table.Column>  {/* 会有很多列 */}
    </Table>
  </ResourceActionProvider>
</CollectionProvider>
```
