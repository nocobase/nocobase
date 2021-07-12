---
title: Menu - 菜单
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Menu - 菜单

需要 antd v4.16+ 支持，在此之前的 Menu.Item 不支持 Fragment 包裹。

## 代码演示

### 横向菜单

```tsx
/**
 * title: 横向菜单
 */
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    menu1: {
      type: 'void',
      'x-component': 'Menu',
      'x-designable-bar': 'Menu.DesignableBar',
      'x-component-props': {
        mode: 'horizontal',
        theme: 'dark',
      },
      properties: {
        item1: {
          type: 'void',
          title: `菜单1`,
          'x-component': 'Menu.Item',
        },
        item2: {
          type: 'void',
          title: `菜单2`,
          'x-component': 'Menu.Item',
        },
        item3: {
          type: 'void',
          title: '菜单组3',
          'x-component': 'Menu.SubMenu',
          properties: {
            item5: {
              type: 'void',
              title: `子菜单5`,
              'x-component': 'Menu.SubMenu',
              properties: {
                item8: {
                  type: 'void',
                  title: `子菜单8`,
                  'x-component': 'Menu.Item',
                },
                item9: {
                  type: 'void',
                  title: `子菜单9`,
                  'x-component': 'Menu.Item',
                },
              },
            },
          }
        },
        item4: {
          type: 'void',
          title: '菜单组4',
          'x-component': 'Menu.SubMenu',
          properties: {
            item6: {
              type: 'void',
              title: `子菜单6`,
              'x-component': 'Menu.Item',
            },
            item7: {
              type: 'void',
              title: `子菜单7`,
              'x-component': 'Menu.Item',
            },
          }
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

### 竖向菜单

```tsx
/**
 * title: 竖向菜单
 */
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    menu1: {
      type: 'void',
      name: 'name1',
      'x-component': 'Menu',
      // 'x-decorator': 'Menu.Designable',
      'x-component-props': {
        mode: 'inline',
      },
      properties: {
        
        item1: {
          type: 'void',
          title: `菜单1`,
          'x-component': 'Menu.Item',
        },
        item2: {
          type: 'void',
          title: `菜单2`,
          'x-component': 'Menu.Item',
        },
        item3: {
          type: 'void',
          title: '菜单组3',
          'x-component': 'Menu.SubMenu',
          properties: {
            item4: {
              type: 'void',
              title: `子菜单4`,
              'x-component': 'Menu.Item',
            },
            item5: {
              type: 'void',
              title: `子菜单5`,
              'x-component': 'Menu.Item',
            },
          }
        },
        item4: {
          type: 'void',
          title: '菜单组4',
          'x-component': 'Menu.SubMenu',
          properties: {
            item6: {
              type: 'void',
              title: `子菜单6`,
              'x-component': 'Menu.Item',
            },
            item7: {
              type: 'void',
              title: `子菜单7`,
              'x-component': 'Menu.Item',
            },
          }
        },
      },
    },
  },
}

export default () => {
  return (
    <div style={{width: 200}}><SchemaRenderer schema={schema} /></div>
  );
};
```

### 混合菜单

```tsx
import React, { useRef, useState } from 'react';
import { SchemaRenderer } from '../';
import { MenuContainerContext } from './';
import { Layout } from 'antd';

export default () => {
  const sideMenuRef = useRef();

  const [activeKey, setActiveKey] = useState('item3');

  const onSelect = (info) => {
    setActiveKey(info.key);
    console.log({ info })
  }

  const schema = {
    type: 'object',
    properties: {
      menu1: {
        type: 'void',
        'x-component': 'Menu',
        'x-component-props': {
          sideMenuRef: '{{ sideMenuRef }}',
          defaultSelectedKeys: [activeKey],
          mode: 'mix',
          theme: 'dark',
          onSelect: '{{ onSelect }}',
        },
        properties: {
          item1: {
            type: 'void',
            title: `菜单1`,
            'x-component': 'Menu.Item',
          },
          item2: {
            type: 'void',
            title: `菜单2`,
            'x-component': 'Menu.Item',
          },
          item3: {
            type: 'void',
            title: '菜单组3',
            'x-component': 'Menu.SubMenu',
            properties: {
              item4: {
                type: 'void',
                title: `子菜单4`,
                'x-component': 'Menu.Item',
              },
              item5: {
                type: 'void',
                title: `子菜单5`,
                'x-component': 'Menu.SubMenu',
                properties: {
                  item8: {
                    type: 'void',
                    title: `子菜单8`,
                    'x-component': 'Menu.Item',
                  },
                  item9: {
                    type: 'void',
                    title: `子菜单9`,
                    'x-component': 'Menu.Item',
                  },
                },
              },
            }
          },
          item4: {
            type: 'void',
            title: '菜单组4',
            'x-component': 'Menu.SubMenu',
            properties: {
              item6: {
                type: 'void',
                title: `子菜单6`,
                'x-component': 'Menu.Item',
              },
              item7: {
                type: 'void',
                title: `子菜单7`,
                'x-component': 'Menu.Item',
              },
            }
          },
        },
      },
    },
  }

  return (
    <div>
      <Layout>
        <Layout.Header>
          <SchemaRenderer 
            schema={schema}
            scope={{ onSelect, sideMenuRef }}
          />
        </Layout.Header>
        <Layout>
          <Layout.Sider ref={sideMenuRef} theme={'light'} width={200}>
          </Layout.Sider>
          <Layout.Content>
            {activeKey}
          </Layout.Content>
        </Layout>
      </Layout>
    </div>
  )
}
```

### 设计器模式

```tsx
import React, { useRef, useState } from 'react';
import { SchemaRenderer } from '../';
import { MenuContainerContext } from './';
import { Layout } from 'antd';

export default () => {
  const sideMenuRef = useRef();

  const [activeKey, setActiveKey] = useState('item3');

  const onSelect = (info) => {
    setActiveKey(info.key);
    console.log({ info })
  }

  const schema = {
    type: 'object',
    properties: {
      menu1: {
        type: 'void',
        'x-component': 'Menu',
        'x-designable-bar': 'Menu.DesignableBar',
        'x-component-props': {
          defaultSelectedKeys: [activeKey],
          mode: 'mix',
          theme: 'dark',
          sideMenuRef: '{{ sideMenuRef }}',
          onSelect: '{{ onSelect }}',
        },
        properties: {
          item1: {
            type: 'void',
            title: `菜单1`,
            'x-component': 'Menu.Item',
          },
          item2: {
            type: 'void',
            title: `菜单2`,
            'x-component': 'Menu.Item',
          },
          item3: {
            type: 'void',
            title: '菜单组3',
            'x-component': 'Menu.SubMenu',
            properties: {
              item34: {
                type: 'void',
                title: `子菜单4`,
                'x-component': 'Menu.Item',
              },
              item5: {
                type: 'void',
                title: `子菜单5`,
                'x-component': 'Menu.SubMenu',
                properties: {
                  item8: {
                    type: 'void',
                    title: `子菜单8`,
                    'x-component': 'Menu.Item',
                  },
                  item9: {
                    type: 'void',
                    title: `子菜单9`,
                    'x-component': 'Menu.Item',
                  },
                },
              },
            }
          },
          item4: {
            type: 'void',
            title: '菜单组4',
            'x-component': 'Menu.SubMenu',
            properties: {
              item6: {
                type: 'void',
                title: `子菜单6`,
                'x-component': 'Menu.Item',
              },
              item7: {
                type: 'void',
                title: `子菜单7`,
                'x-component': 'Menu.Item',
              },
            }
          },
        },
      },
    },
  }

  return (
    <div>
      <Layout>
        <Layout.Header>
          <SchemaRenderer
            schema={schema}
            scope={{ onSelect, sideMenuRef }}
          />
        </Layout.Header>
        <Layout>
          <Layout.Sider 
            ref={sideMenuRef}
            theme={'light'}
            width={200}
          >
          </Layout.Sider>
          <Layout.Content>
            {activeKey}
          </Layout.Content>
        </Layout>
      </Layout>
    </div>
  )
}
```

### 设计器模式 - 菜单项为空时

```tsx
import React, { useRef, useState } from 'react';
import { SchemaRenderer } from '../';
import { MenuContainerContext } from './';
import { Layout } from 'antd';

export default () => {
  const sideMenuRef = useRef();

  const [activeKey, setActiveKey] = useState('item3');

  const onSelect = (info) => {
    setActiveKey(info.key);
    console.log({ info })
  }

  const schema = {
    type: 'object',
    properties: {
      menu1: {
        type: 'void',
        'x-component': 'Menu',
        'x-designable-bar': 'Menu.DesignableBar',
        'x-component-props': {
          defaultSelectedKeys: [activeKey],
          mode: 'mix',
          theme: 'dark',
          sideMenuRef: '{{ sideMenuRef }}',
          onSelect: '{{ onSelect }}',
        },
      },
    },
  }

  return (
    <div>
      <Layout>
        <Layout.Header>
          <SchemaRenderer
            schema={schema}
            scope={{ onSelect, sideMenuRef }}
          />
        </Layout.Header>
        <Layout>
          <Layout.Sider 
            ref={sideMenuRef}
            theme={'light'}
            width={200}
          >
          </Layout.Sider>
          <Layout.Content>
            {activeKey}
          </Layout.Content>
        </Layout>
      </Layout>
    </div>
  )
}
```

### Menu.Action


```tsx
/**
 * title: 横向菜单
 */
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    menu1: {
      type: 'void',
      'x-component': 'Menu',
      'x-designable-bar': 'Menu.DesignableBar',
      'x-component-props': {
        mode: 'horizontal',
        theme: 'dark',
      },
      properties: {
        item1: {
          type: 'void',
          title: `菜单1`,
          'x-component': 'Menu.Item',
        },
        item2: {
          type: 'void',
          title: `菜单1`,
          'x-component': 'Menu.Action',
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
