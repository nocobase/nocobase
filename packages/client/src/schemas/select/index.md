---
title: Select - 选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Select - 选择器

## Node Tree

<pre lang="tsx">
// 常规选择器
<Select/>
// 选项值为对象类型
<Select.Object>
// 抽屉选择器
<Select.Drawer>
  // 可选项
  <Select.Options>
    <Form>
      <Table>
        <Action/>
      </Table>
    </Form>
  </Select.Options>
  // 选中项详情
  <Select.OptionTag>
    <Form>
      // 添加其他节点
    </Form>
  </Select.OptionTag>
</Select.Drawer>
</pre>

## Designable Bar

- Select.DesignableBar
- Select.Drawer.DesignableBar
- Select.Options.DesignableBar
- Select.OptionTag.DesignableBar

## Examples

### 单选

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const options = [
  {
    label: '选项1',
    value: 1,
    color: 'red',
  },
  {
    label: '选项2',
    value: 2,
    color: 'blue',
  },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'number',
      title: `编辑模式`,
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Select.Object',
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read: {
      type: 'number',
      title: `阅读模式`,
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Select.Object',
      'x-read-pretty': true,
    },
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema}/>
  );
};
```

### 多选

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const options = [
  {
    label: '选项1',
    value: 1,
    color: 'red',
  },
  {
    label: '选项2',
    value: 2,
    color: 'blue',
  },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'string',
      type: 'string',
      title: `编辑模式`,
      name: 'name1',
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        mode: 'tags',
      },
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read: {
      interface: 'string',
      type: 'string',
      title: `阅读模式`,
      enum: options,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        mode: 'tags',
      },
    },
  }
}

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```

### 分组

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const dataSource = [
  {
    label: 'Manager',
    children: [
      {value: 'jack', label: 'Jack'},
    ],
  },
  {
    label: 'Engineer',
    children: [
      {value: 'lucy', label: 'Lucy'},
    ],
  },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'select',
      type: 'number',
      title: `编辑模式`,
      enum: dataSource,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        placeholder: 'please enter',
      },
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read: {
      interface: 'select',
      type: 'number',
      title: `阅读模式`,
      required: true,
      enum: dataSource,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        placeholder: 'please enter',
      },
    }
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema}/>
  );
};
```

## Select.Object

选项值为 Object 类型

### 单选

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const dataSource = [
  {
    id: 1,
    title: '标题1',
  },
  {
    id: 2,
    title: '标题2',
  },
  {
    id: 3,
    title: '标题3',
  },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'object',
      title: `编辑模式`,
      enum: dataSource,
      'x-decorator': 'FormItem',
      'x-component': 'Select.Object',
      'x-component-props': {
        placeholder: 'please enter',
        // mode: 'tags',
        fieldNames: {
          label: 'title',
          value: 'id',
        },
      },
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read: {
      type: 'object',
      title: `阅读模式`,
      enum: dataSource,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Select.Object',
      'x-component-props': {
        placeholder: 'please enter',
        // mode: 'tags',
        fieldNames: {
          label: 'title',
          value: 'id',
        },
      },
    }
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```

### 多选

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const dataSource = [
  {
    id: 1,
    title: '标题1',
  },
  {
    id: 2,
    title: '标题2',
  },
  {
    id: 3,
    title: '标题3',
  },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'array',
      title: `编辑模式`,
      enum: dataSource,
      'x-decorator': 'FormItem',
      'x-component': 'Select.Object',
      'x-component-props': {
        placeholder: 'please enter',
        mode: 'tags',
        fieldNames: {
          label: 'title',
          value: 'id',
        },
      },
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read: {
      type: 'array',
      title: `阅读模式`,
      enum: dataSource,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Select.Object',
      'x-component-props': {
        placeholder: 'please enter',
        mode: 'tags',
        fieldNames: {
          label: 'title',
          value: 'id',
        },
      },
    }
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```

## Select.Drawer

<code src="./demos/demo1.tsx"/>

## Schema API

### Select

type 支持 string、number、object 和 array，array 元素可以是 string、number 或 object。如：

```ts
{
  properties: {
    select: {
      type: 'string', // 也可以是 number、object、array
      'x-component': 'Select',
    }
  }
}
```

可以配置 dataSource（enum）的 fieldNames，如：

```ts
{
  properties: {
    select: {
      type: 'string', // 也可以是 number、object、array
      'x-component': 'Select',
      'x-component-props': {
        fieldNames: {
          label: 'label', // 标签文案
          value: 'value',
          color: 'color', // 标签颜色
          children: 'children', // 选项分组时，选项字段对应的 key
        },
      },
    },
  }
}
```

### Select.Drawer 

type 支持 object 和 array，Select.Drawer 的可选项是以抽屉方式展开，提供了 Select.Options 和 Select.OptionTag 用于配置可选项界面和选中项详情界面。
