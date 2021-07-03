---
title: Form - 表单
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Components - 组件
  path: /client/components
---

# Form - 表单

## 代码演示

### 常规表单

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    form: {
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
    }
  },
}

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

const schema = {
  type: 'void',
  name: 'item3',
  'x-decorator': 'Card',
  'x-component': 'Form',
  properties: {
    grid: {
      type: 'void',
      title: 'aa',
      'x-component': 'Grid',
      properties: {
        row1: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            col1: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 2,
              },
              properties: {
                block11: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block11',
                  },
                  properties: {
                    field1: {
                      type: 'string',
                      required: true,
                      title: '字段1',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
            col2: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 2,
                isLast: true,
              },
              properties: {
                block21: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block21',
                  },
                  properties: {
                    field2: {
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
        row2: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            col21: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 3,
              },
              properties: {
                block211: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block211',
                  },
                  properties: {
                    field3: {
                      type: 'string',
                      required: true,
                      title: '字段3',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
            col22: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 2 / 3,
                isLast: true,
              },
              properties: {
                block221: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block221',
                  },
                  properties: {
                    field4: {
                      type: 'string',
                      required: true,
                      title: '字段4',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
          },
        },
        row3: {
          type: 'void',
          'x-component': 'Grid.Row',
          "x-component-props": {
            isLast: true,
          },
          properties: {
            col31: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1,
                isLast: true,
              },
              properties: {
                block311: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block311',
                  },
                  properties: {
                    field5: {
                      type: 'string',
                      required: true,
                      title: '字段5',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
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
  name: `form_${uid()}`,
  'x-decorator': 'Card',
  'x-component': 'Form',
  properties: {
    grid: {
      type: 'void',
      'x-component': 'Grid',
      properties: {
        row1: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            col1: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 2,
              },
              properties: {
                block11: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block11',
                  },
                  'x-designable-bar': 'Input.DesignableBar',
                  properties: {
                    field1: {
                      type: 'string',
                      required: true,
                      title: '字段1',
                      'x-designable-bar': 'FormItem.DesignableBar',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
            col2: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 2,
                isLast: true,
              },
              properties: {
                block21: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block21',
                  },
                  'x-designable-bar': 'Input.DesignableBar',
                  properties: {
                    field2: {
                      type: 'string',
                      required: true,
                      title: '字段2',
                      'x-designable-bar': 'FormItem.DesignableBar',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
          },
        },
        row2: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            col21: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 3,
              },
              properties: {
                block211: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block211',
                  },
                  'x-designable-bar': 'Input.DesignableBar',
                  properties: {
                    field3: {
                      type: 'string',
                      required: true,
                      title: '字段3',
                      'x-designable-bar': 'FormItem.DesignableBar',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
            col22: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 2 / 3,
                isLast: true,
              },
              properties: {
                block221: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block221',
                  },
                  'x-designable-bar': 'Input.DesignableBar',
                  properties: {
                    field4: {
                      type: 'string',
                      required: true,
                      title: '字段4',
                      'x-designable-bar': 'FormItem.DesignableBar',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
          },
        },
        row3: {
          type: 'void',
          'x-component': 'Grid.Row',
          "x-component-props": {
            isLast: true,
          },
          properties: {
            col31: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1,
                isLast: true,
              },
              properties: {
                block311: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block311',
                  },
                  properties: {
                    field5: {
                      type: 'string',
                      required: true,
                      title: '字段5',
                      'x-designable-bar': 'FormItem.DesignableBar',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
          },
        },
        [`gr_${uid()}`]: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            [`gc_${uid()}`]: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1,
              },
              properties: {
                [`gb_${uid()}`]: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  properties: {
                    [`gbn_${uid()}`]: {
                      type: 'void',
                      'x-component': 'AddNew.FormItem',
                    },
                  },
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
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```