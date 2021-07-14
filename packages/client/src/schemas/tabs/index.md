---
title: Tabs - 标签页
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Tabs - 标签页

## Node

<pre lang="tsx">
<Tabs>
  <Tabs.TabPane title={'标签 1'}>
    // 添加其他节点
  </Tabs.TabPane>
  <Tabs.TabPane title={'标签 2'}>
    // 添加其他节点
  </Tabs.TabPane>
</Tabs>
</pre>

## Designable Bar

- Tabs.DesignableBar

## Examples

### 基本使用

```tsx
/**
 * title: 基本使用
 */
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    tabs: {
      type: 'void',
      'x-component': 'Tabs',
      properties: {
        tab1: {
          type: 'void',
          'x-component': 'Tabs.TabPane',
          'x-component-props': {
            tab: 'Tab1',
          },
          properties: {
            aaa: {
              type: 'string',
              title: 'AAA',
              'x-decorator': 'FormItem',
              required: true,
              'x-component': 'Input',
            },
          },
        },
        tab2: {
          type: 'void',
          'x-component': 'Tabs.TabPane',
          'x-component-props': {
            tab: 'Tab2',
          },
          properties: {
            bbb: {
              type: 'string',
              title: 'BBB',
              'x-decorator': 'FormItem',
              required: true,
              'x-component': 'Input',
            },
          },
        },
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
