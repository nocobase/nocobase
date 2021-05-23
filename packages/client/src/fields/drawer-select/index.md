---
title: DrawerSelect - 抽屉选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# DrawerSelect - 抽屉选择器

## 代码演示

### 抽屉选择器

```tsx
/**
 * title: 抽屉选择器
 */
import React from 'react';
import { Field } from '@nocobase/client';

const schema = [
  {
    interface: 'icon',
    type: 'string',
    title: `编辑模式`,
    name: 'name1',
    'x-decorator': 'FormItem',
    'x-component': 'DrawerSelect',
    'x-component-props': {
      placeholder: '选择...',
      labelField: 'title',
      valueField: 'id',
      mode: 'multiple',
      renderOptions: ({ value, onChange, resolve }) => (
        <ul>
          {[1,2,3].map(id => (
            <li><a onClick={() => {
              onChange([{
                id,
                title: `标题${id}`,
                content: `内容${id}`,
              }]);
              resolve();
            }}>标题{id}</a></li>
          ))}
        </ul>
      ),
    },
    'x-reactions': {
      target: 'name2',
      fulfill: {
        state: {
          value: '{{$self.value}}',
        },
      },
    },
  },
  {
    interface: 'icon',
    type: 'string',
    title: `阅读模式`,
    name: 'name2',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'DrawerSelect',
    'x-component-props': {
      labelField: 'title',
      valueField: 'id',
      mode: 'multiple',
      renderItem: ({item}) => <div>{item.content}</div>,
    },
  },
];

const data = {
  name1: [
    {
      id: 1,
      title: '标题1',
      content: '内容1',
    },
    {
      id: 2,
      title: '标题2',
      content: '内容2',
    }
  ],
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```

## 参数说明

### renderTag

自定义 Tag 内容

### renderItem

自定义单项内容（在抽屉里显示）

### renderOptions

自定义选项列表（在抽屉里显示）