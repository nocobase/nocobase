---
title: AddNew - 创建
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# AddNew - 创建

## Node Tree

<pre lang="tsx">
// 简单场景，只支持上下拖拽布局
<DragAndDrop>
  // 常规区块
  <AddNew.BlockItem/>
  // 或表单控件
  <AddNew.BlockItem/>
</DragAndDrop>

// 栅格布局，支持行列等复杂的拖拽操作
<Grid>
  <Grid.Row locked>
    <Grid.Col>
      // 常规区块
      <AddNew.BlockItem/>
      // 或表单控件
      <AddNew.BlockItem/>
    </Grid.Col>
  </Grid.Row>
</Grid>
</pre>

## Designable Bar

暂无

## Examples

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
