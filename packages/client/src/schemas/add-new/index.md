---
title: AddNew - 新增
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# AddNew - 新增

包括两部分

- AddNew.BlockItem 新增区块项
- AddNew.FormItem 新增表单项

支持常规布局也支持 Grid 布局

## 代码演示

### AddNew.BlockItem

如果需要支持拖拽，需要将 AddNew.BlockItem 组件放于 DragAndDrop 组件中。

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
          'x-component': 'AddNew.BlockItem',
        }
      }
    },
  },
};

export default () => {
  return <SchemaRenderer schema={schema} />
}
```


### AddNew.FormItem

如果需要支持拖拽，需要将 AddNew.FormItem 组件放于 DragAndDrop 组件中。

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
          'x-component': 'AddNew.FormItem',
        }
      }
    },
  },
};

export default () => {
  return <SchemaRenderer schema={schema} />
}
```

### Grid 布局中的 AddNew.BlockItem

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
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'AddNew.BlockItem',
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
