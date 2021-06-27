---
title: Action - 操作
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 区块 - Blocks
  path: /client/blocks
---

# Action - 操作

操作有三类：

- 常规操作
- 弹出层操作，弹出层有 Drawer、Modal、Popover
- 指定容器内操作 Container
- 下拉菜单，用于收纳多种操作
- 跳转操作

## Action - 常规操作

```tsx
/**
 * title: 按钮操作
 * desc: 可以通过配置 `useAction` 来处理操作逻辑
 */
import React from 'react';
import { SchemaBlock, registerScope } from '../';

function useCustomAction() {
  return {
    run() {
      alert('这是自定义的操作逻辑');
    }
  }
}

registerScope({
  useCustomAction,
});

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  'x-component-props': {
    useAction: '{{ useCustomAction }}'
  },
};

export default () => {
  return <SchemaBlock schema={schema} />
}
```

## Action.Link - 内链跳转

```tsx
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action.Link',
  'x-component-props': {
    to: 'abc',
  },
};

export default () => {
  return <SchemaBlock schema={schema} />
}
```

## Action.URL - 外链跳转

```tsx
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action.URL',
  'x-component-props': {
    url: 'https://www.nocobase.com/',
  },
};

export default () => {
  return <SchemaBlock schema={schema} />
}
```

## Action.Popover - 打开气泡

```tsx
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  properties: {
    drawer1: {
      type: 'void',
      title: '弹窗标题',
      'x-component': 'Action.Popover',
      'x-component-props': {},
      properties: {
        input: {
          type: 'string',
          'x-component': 'Input',
        }
      },
    },
  },
};

export default () => {
  return <SchemaBlock schema={schema} />
}
```

## Action.Drawer - 打开抽屉

```tsx
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  properties: {
    drawer1: {
      type: 'void',
      title: '抽屉标题',
      'x-component': 'Action.Drawer',
      'x-component-props': {},
      properties: {
        input: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        action2: {
          type: 'void',
          title: '打开二级抽屉',
          // 'x-decorator': 'FormItem',
          'x-component': 'Action',
          properties: {
            drawer1: {
              type: 'void',
              title: '二级抽屉标题',
              'x-component': 'Action.Drawer',
              'x-component-props': {},
              properties: {
                input: {
                  type: 'string',
                  'x-component': 'Input',
                },
              },
            },
          },
        }
      },
    },
  },
};

export default () => {
  return <SchemaBlock schema={schema} />
}
```

## Action.Modal - 打开对话框

```tsx
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  properties: {
    drawer1: {
      type: 'void',
      title: '弹窗标题',
      'x-component': 'Action.Modal',
      'x-component-props': {},
      properties: {
      },
    },
  },
};

export default () => {
  return <SchemaBlock schema={schema} />
}
```

## Action.Container - 指定容器内打开

```tsx
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  properties: {
    drawer1: {
      type: 'void',
      title: '页面标题',
      'x-component': 'Action.Container',
      'x-component-props': {
        container: '#container'
      },
      properties: {
        input: {
          type: 'string',
          title: '字段',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        }
      },
    },
  },
};

export default () => {
  return (
    <div>
      <SchemaBlock schema={schema} />
      <div style={{padding: '8px 0'}}>目标容器：</div>
      <div id={'container'} style={{ border: '1px dashed #ebedf1', background: '#fafafa', padding: 24 }}/>
    </div>
  )
}
```

## Action.DesignableBar - 按钮配置操作栏

```tsx
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  'x-designable-bar': 'Action.DesignableBar',
  properties: {
    drawer1: {
      type: 'void',
      title: '抽屉标题',
      'x-component': 'Action.Drawer',
      'x-component-props': {},
      properties: {
        input: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        action2: {
          type: 'void',
          title: '打开二级抽屉',
          // 'x-decorator': 'FormItem',
          'x-component': 'Action',
          properties: {
            drawer1: {
              type: 'void',
              title: '二级抽屉标题',
              'x-component': 'Action.Drawer',
              'x-component-props': {},
              properties: {
                input: {
                  type: 'string',
                  'x-component': 'Input',
                },
              },
            },
          },
        }
      },
    },
  },
};

export default () => {
  return <SchemaBlock schema={schema} />
}
```

