---
title: Form - 表单
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Form - 表单

## 代码演示

### 常规表单

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  name: 'form',
  type: 'object',
  'x-component': 'Form',
  properties: {
    username: {
      type: 'string',
      title: '用户名',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    password: {
      type: 'string',
      title: '密码',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Password',
    },
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```

### 栅格布局表单

```tsx
import React from 'react';
import { SchemaRenderer } from '../';
import { uid } from '@formily/shared';

const schema = {
  type: 'void',
  name: uid(),
  'x-decorator': 'Card',
  'x-component': 'Form',
  properties: {
    [uid()]: {
      type: 'void',
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
                [`block_${uid()}`]: {
                  type: 'string',
                  required: true,
                  title: '字段1',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                },
              },
            },
            [`col_${uid()}`]: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                [`block_${uid()}`]: {
                  type: 'string',
                  required: true,
                  title: '字段2',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                },
              },
            },
          },
        },
      },
    },
    actions: {
      type: 'void',
      // 'x-decorator': 'Div',
      'x-component': 'Space',
      properties: {
        submit: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            // block: true,
            type: 'primary',
            useAction: '{{ useLogin }}',
            style: {
              // width: '100%',
            },
          },
          title: '提交',
        },
        reset: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            // block: true,
            useAction: '{{ useLogin }}',
            style: {
              // width: '100%',
            },
          },
          title: '重置',
        },
      },
    },
  },
}

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```

### 表单设计器

```tsx
import React from 'react';
import { SchemaRenderer } from '../';
import { uid } from '@formily/shared';

const schema = {
  type: 'void',
  name: uid(),
  'x-decorator': 'Card',
  'x-component': 'Form',
  'x-designable-bar': 'Form.DesignableBar',
  properties: {
    [uid()]: {
      type: 'void',
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
                [`block_${uid()}`]: {
                  type: 'string',
                  required: true,
                  title: '字段1',
                  'x-decorator': 'FormItem',
                  'x-designable-bar': 'FormItem.DesignableBar',
                  'x-component': 'Input',
                },
              },
            },
            [`col_${uid()}`]: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                [`block_${uid()}`]: {
                  type: 'string',
                  required: true,
                  title: '字段2',
                  'x-decorator': 'FormItem',
                  'x-designable-bar': 'FormItem.DesignableBar',
                  'x-component': 'Input',
                },
              },
            },
          },
        },
      },
    },
    actions: {
      type: 'void',
      // 'x-decorator': 'Div',
      'x-component': 'Space',
      properties: {
        submit: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            // block: true,
            type: 'primary',
            useAction: '{{ useLogin }}',
            style: {
              // width: '100%',
            },
          },
          title: '提交',
        },
        reset: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            // block: true,
            useAction: '{{ useLogin }}',
            style: {
              // width: '100%',
            },
          },
          title: '重置',
        },
      },
    },
  },
}

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```