---
group:
  title: Schema 组件
  path: /zh-CN/components/schema-components
  order: 2
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

### Action

```tsx
/**
 * title: 按钮操作
 * desc: 可以通过配置 `useAction` 来处理操作逻辑
 */
import React from 'react';
// @ts-ignore
import { SchemaRenderer } from '@nocobase/client';

function useAction() {
  return {
    run() {
      alert('这是自定义的操作逻辑');
    },
  };
}

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  'x-designable-bar': 'Action.DesignableBar',
  'x-component-props': {
    useAction: '{{ useAction }}',
    tooltip: '提示信息',
    confirm: {
      title: 'Do you Want to delete these items?',
    },
  },
};

export default () => {
  return (
    <SchemaRenderer 
      debug={true} 
      scope={{ useAction }} 
      schema={schema} 
    />
  );
};
```

### Action.Modal

```tsx
import React from 'react';
import { SchemaRenderer } from '@nocobase/client';
import { Space } from 'antd';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  'x-designable-bar': 'Action.DesignableBar',
  'x-component-props': {
  },
  properties: {
    modal1: {
      type: 'void',
      title: '对话框标题',
      'x-component': 'Action.Modal',
      properties: {
        input: {
          type: 'string',
          title: '输入框',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
  },
};

const schema2 = {
  type: 'void',
  name: 'action1',
  title: 'ModalForm',
  'x-component': 'Action',
  'x-designable-bar': 'Action.DesignableBar',
  'x-component-props': {
  },
  properties: {
    modal1: {
      type: 'void',
      title: '对话框标题',
      'x-decorator': 'Form',
      'x-component': 'Action.Modal',
      properties: {
        input: {
          type: 'string',
          title: '输入框',
          required: true,
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
      <SchemaRenderer 
        schema={schema} 
      />
      <SchemaRenderer 
        schema={schema2} 
      />
    </Space>
  );
};
```

### Action.Drawer

```tsx
import React from 'react';
import { SchemaRenderer } from '@nocobase/client';
import { Space } from 'antd';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  'x-designable-bar': 'Action.DesignableBar',
  'x-component-props': {
  },
  properties: {
    modal1: {
      type: 'void',
      title: '抽屉标题',
      'x-component': 'Action.Drawer',
      properties: {
        input: {
          type: 'string',
          title: '输入框',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
  },
};

const schema2 = {
  type: 'void',
  name: 'action1',
  title: 'DrawerForm',
  'x-component': 'Action',
  'x-designable-bar': 'Action.DesignableBar',
  'x-component-props': {
  },
  properties: {
    modal1: {
      type: 'void',
      title: '抽屉标题',
      'x-decorator': 'Form',
      'x-component': 'Action.Drawer',
      properties: {
        input: {
          type: 'string',
          title: '输入框',
          required: true,
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
      <SchemaRenderer 
        schema={schema} 
      />
      <SchemaRenderer 
        schema={schema2} 
      />
    </Space>
  );
};
```

### Action.Dropdown

```tsx
import React from 'react';
import { SchemaRenderer } from '@nocobase/client';

const schema = {
  type: 'void',
  name: 'action1',
  title: '下拉菜单',
  'x-component': 'Action',
  'x-designable-bar': 'Action.DesignableBar',
  'x-component-props': {
  },
  properties: {
    dropdown1: {
      type: 'void',
      'x-component': 'Action.Dropdown',
      'x-component-props': {},
      properties: {
        item1: {
          type: 'void',
          title: `操作1`,
          'x-designable-bar': 'Action.DesignableBar',
          'x-component': 'Menu.Action',
          properties: {
            modal1: {
              type: 'void',
              title: '对话框标题',
              'x-component': 'Action.Modal',
              properties: {
                input: {
                  type: 'string',
                  title: '输入框',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-designable-bar': 'Input.DesignableBar',
                },
                grid: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-component-props': {
                    addNewComponent: 'AddNew.FormItem',
                  },
                },
              },
            },
          },
        },
        item2: {
          type: 'void',
          title: `操作2`,
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.Action',
          properties: {
            modal2: {
              type: 'void',
              title: '对话框标题',
              'x-component': 'Action.Modal',
              properties: {
                input: {
                  type: 'string',
                  'x-component': 'Input',
                },
              },
            },
          },
        },
      },
    }
  },
};

export default () => {
  return (
    <SchemaRenderer 
      debug={true} 
      schema={schema} 
    />
  );
};
```

### Action.Popover

```tsx
import React from 'react';
import { SchemaRenderer } from '@nocobase/client';
import { Space } from 'antd';

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  'x-designable-bar': 'Action.DesignableBar',
  'x-component-props': {
  },
  properties: {
    modal1: {
      type: 'void',
      title: '抽屉标题',
      'x-component': 'Action.Popover',
      properties: {
        input: {
          type: 'string',
          title: '输入框',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
  },
};

const schema2 = {
  type: 'void',
  name: 'action1',
  title: 'PopoverForm',
  'x-component': 'Action',
  'x-designable-bar': 'Action.DesignableBar',
  'x-component-props': {
  },
  properties: {
    modal1: {
      type: 'void',
      title: '抽屉标题',
      'x-decorator': 'Form',
      'x-component': 'Action.Popover',
      properties: {
        input: {
          type: 'string',
          title: '输入框',
          required: true,
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
      <SchemaRenderer 
        schema={schema} 
      />
      <SchemaRenderer 
        schema={schema2} 
      />
    </Space>
  );
};
```

### Action.Group

```tsx
import React from 'react';
import { SchemaRenderer } from '@nocobase/client';

const schema = {
  type: 'void',
  name: 'group1',
  'x-component': 'Action.Group',
  properties: {
    a1: {
      type: 'void',
      title: '按钮1',
      'x-component': 'Action',
      'x-component-props': {},
    },
    a2: {
      type: 'void',
      title: '按钮2',
      'x-component': 'Action',
      'x-component-props': {},
    },
  },
};

export default () => {
  return (
    <SchemaRenderer 
      schema={schema} 
    />
  );
};
```

### Action.Bar

```tsx
import React from 'react';
import { SchemaRenderer } from '@nocobase/client';

const schema = {
  type: 'void',
  name: 'actionbar1',
  'x-component': 'Action.Bar',
  'x-designable-bar': 'Action.Bar.DesignableBar',
  'x-component-props': {
  },
};

export default () => {
  return (
    <SchemaRenderer 
      schema={schema} 
    />
  );
};
```
