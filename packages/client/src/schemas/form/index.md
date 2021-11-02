---
nav:
  path: /components
group:
  path: /components/schema-components
---

# Form - 表单

## Node Tree

<pre lang="tsx">
<Form>
  <Input/>
  <Select/>
  // 添加其他节点
</Form>

<Form>
  // Form.Field 可用于覆盖字段原配置，但不修改原字段配置，新配置只作用于当前 Form
  <Form.Field title={'自定义标题'}>
    <Input title={'原标题'}>
  </Form.Field>
</Form>

// Form 用作 decorator 时只用于添加独立的作用域
<Table x-decorator={'Form'}/>
</pre>

## Designable Bar

- Form.DesignableBar

## Examples

### 常规表单

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  name: 'form',
  'x-component': 'Form',
  'x-component-props': {
    layout: 'horizontal',
  },
  properties: {
    username: {
      type: 'string',
      title: '用户名',
      required: true,
      'x-decorator': 'FormItem',
      'x-designable-bar': 'FormItem.DesignableBar',
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
    <SchemaRenderer debug={true} schema={schema} />
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
            type: 'primary',
          },
          title: '提交',
        },
        reset: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {},
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
  'x-decorator': 'BlockItem',
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
            type: 'primary',
          },
          title: '提交',
        },
        reset: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
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