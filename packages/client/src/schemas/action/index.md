---
title: Action - 操作
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Action - 操作

操作有三类：

- 常规操作：Action
- 弹出层操作，弹出层可以是 Action.Drawer、Action.Modal、Action.Popover
- 指定容器内打开： Action.Container
- 下拉菜单：Action.Dropdown，用于收纳多种操作
- 跳转操作：Action.Link、Action.URL 和 Action.Route

Action.Drawer、Action.Modal、Action.Popover 和 Action.Container 需要和 Action 搭配使用

## Action - 常规操作

```tsx
/**
 * title: 按钮操作
 * desc: 可以通过配置 `useAction` 来处理操作逻辑
 */
import React from 'react';
import { SchemaRenderer, registerScope } from '../';

function useAction() {
  return {
    run() {
      alert('这是自定义的操作逻辑');
    }
  }
}

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  'x-component-props': {
    useAction,
  },
};

export default () => {
  return <SchemaRenderer schema={schema} />
}
```

## Action.Link - 内链跳转

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

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
  return <SchemaRenderer schema={schema} />
}
```

## Action.URL - 外链跳转

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

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
  return <SchemaRenderer schema={schema} />
}
```

## Action.Dropdown - 下拉操作

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

function useAction() {
  return {
    run() {
      alert('这是自定义的操作逻辑');
    }
  }
}

const popoverSchema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  properties: {
    popover1: {
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

const drawerSchema = {
  type: 'void',
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

const schema = {
  type: 'void',
  name: 'action1',
  title: '下拉菜单',
  'x-component': 'Action.Dropdown',
  properties: {
    action1: {
      type: 'void',
      name: 'action1',
      title: '按钮',
      'x-component': 'Action',
      'x-component-props': {
        useAction,
      },
    },
    action2: drawerSchema,
    action3: popoverSchema,
  },
};

export default () => {
  return <SchemaRenderer schema={schema} />
}
```

## Action.Popover - 打开气泡

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  properties: {
    popover1: {
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
  return <SchemaRenderer schema={schema} />
}
```

## Action.Drawer - 打开抽屉

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

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
  return <SchemaRenderer schema={schema} />
}
```

## Action.Modal - 打开对话框

```tsx
import React from 'react';
import { SchemaRenderer } from '../';
import { useVisibleContext } from './';

function useAction() {
  const { visible, setVisible } = useVisibleContext();
  return {
    async run() {
      console.log({ visible })
      setVisible(false);
    }
  }
}

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
        input: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        close: {
          type: 'void',
          name: 'action1',
          title: '关闭',
          'x-component': 'Action',
          'x-component-props': {
            useAction,
          },
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
              'x-component': 'Action.Modal',
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
  return <SchemaRenderer schema={schema} />
}
```

## Action.Container - 指定容器内打开

```tsx
import React, { useRef } from 'react';
import { SchemaRenderer } from '../';
import { ActionContext } from './';

export default () => {
  const containerRef = useRef();
  const schema = {
    type: 'void',
    name: 'action1',
    title: '按钮',
    'x-component': 'Action',
    'x-component-props': {
      containerRef
    },
    properties: {
      container1: {
        type: 'void',
        title: '页面标题',
        'x-component': 'Action.Container',
        properties: {
          input: {
            type: 'string',
            title: '字段',
            'x-designable-bar': 'FormItem.DesignableBar',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          }
        },
      },
    },
  };
  return (
    <div>
      <SchemaRenderer schema={schema} />
    </div>
  )
}
```
