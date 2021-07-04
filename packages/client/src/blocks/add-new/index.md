---
title: AddNew - 新增
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Components - 组件
  path: /client/components
---

# AddNew - 新增

可用于新增区块 AddNew 或表单项 AddNew.FormItem，支持常规布局也支持 Grid 布局。

## 代码演示

### 基本使用

```tsx
import React from 'react';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaRenderer } from '../';

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      type: 'void',
      'x-component': 'DragAndDrop',
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'AddNew',
        }
      }
    },
  },
};

export default () => {
  return <SchemaRenderer schema={schema} />
}
```

### Grid 布局的 AddNew

```tsx
import React from 'react';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaRenderer } from '../';

const schema: ISchema = {
  type: 'void',
  name: uid(),
  'x-component': 'Grid',
  properties: {
    [`row_${uid()}`]: {
      type: 'void',
      'x-component': 'Grid.Row',
      properties: {
        [`col_${uid()}`]: {
          type: 'void',
          'x-component': 'Grid.Col',
          'x-component-props': {
            width: 30,
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'AddNew',
            },
          },
        },
      },
    },
  },
};

export default () => {
  return <SchemaRenderer schema={schema} />
}
```

### Grid 布局的 AddNew.FormItem

```tsx
import React from 'react';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaRenderer } from '../';

const schema: ISchema = {
  type: 'void',
  name: uid(),
  'x-component': 'Grid',
  properties: {
    [`row_${uid()}`]: {
      type: 'void',
      'x-component': 'Grid.Row',
      properties: {
        [`col_${uid()}`]: {
          type: 'void',
          'x-component': 'Grid.Col',
          'x-component-props': {
            width: 30,
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'AddNew.FormItem',
            },
          },
        },
      },
    },
  },
};

export default () => {
  return <SchemaRenderer schema={schema} />
}
```
