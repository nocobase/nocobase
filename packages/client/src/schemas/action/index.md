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

## Node Tree

<pre lang="tsx">
////////// 单节点 //////////

// 常规按钮操作
<Action/>
// 内链
<Action.Link/>
// 外链
<Action.URL/>

////////// 弹出层相关操作 //////////

// 对话框
<Action title={'按钮标题'}>
  <Action.Modal title={'对话框标题'}>
    // 添加其他节点
  </Action.Modal>
</Action>

// 抽屉
<Action title={'按钮标题'}>
  <Action.Drawer title={'抽屉标题'}>
    // 添加其他节点
  </Action.Drawer>
</Action>

// 气泡
<Action title={'按钮标题'}>
  <Action.Popover title={'气泡标题'}>
    // 添加其他节点
  </Action.Popover>
</Action>

// 指定容器
<Action title={'按钮标题'}>
  <Action.Container>
    // 添加其他节点
  </Action.Container>
</Action>

////////// 操作分组 //////////

// 下拉操作
<Action.Dropdown>
  <Action/>
  <Action title={'按钮标题'}>
    <Action.Modal title={'对话框标题'}>
      // 添加其他节点
    </Action.Modal>
  </Action>
</Action.Dropdown>
</pre>

## Designable Bar

- Action.DesignableBar
- Action.Modal.DesignableBar
- Action.Drawer.DesignableBar
- Action.Popover.DesignableBar

## Examples

### Action - 常规操作

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
  'x-designable-bar': 'Action.DesignableBar',
  'x-component-props': {
    useAction: '{{ useAction }}',
  },
};

export default () => {
  return <SchemaRenderer debug={true} scope={{ useAction }} schema={schema} />
}
```

### Action.Link - 内链跳转

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

### Action.URL - 外链跳转

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

### Action.Dropdown - 下拉操作

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

### Action.Popover - 打开气泡

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

### Action.Drawer - 打开抽屉

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

### Action.Modal - 打开对话框

`x-decorator='Form'` 时，Model 为 Form，并自带按钮

```tsx
import React from 'react';
import { Space } from 'antd';
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

const schema2 = {
  type: 'void',
  name: 'action1',
  title: 'x-decorator=Form',
  'x-component': 'Action',
  properties: {
    drawer1: {
      type: 'void',
      title: '弹窗标题',
      'x-component': 'Action.Modal',
      'x-component-props': {},
      'x-decorator': 'Form',
      properties: {
        input: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
  },
};

export default () => {
  return (
    <Space>
      <SchemaRenderer schema={schema} />
      <SchemaRenderer schema={schema2} />
    </Space>
  )
}
```

### Action.Container - 指定容器内打开

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
