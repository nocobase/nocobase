---
order: 2
---

# 客户端内核

## Hello World

NocoBase 的客户端内核实质上是一个 React 应用。

```jsx
/**
 * defaultShowCode: true
 * title: Hello World
 */
import React from 'react';

export default function App() {
  return <h1>Hello, world!</h1>;
};
```

## Router

上述例子有些简单，考虑到实际大多数应用都会用到路由，所以加了 react-router，如：

```jsx
/**
 * defaultShowCode: true
 * title: Router
 */
import React from 'react';
import { Route, Switch, Link, MemoryRouter as Router } from 'react-router-dom';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

const App = () => (
  <Router initialEntries={['/']}>
    <Link to={'/'}>Home</Link>, <Link to={'/about'}>About</Link>
    <Switch>
      <Route exact path="/">
        <Home />
      </Route>
      <Route path="/about">
        <About />
      </Route>
    </Switch>
  </Router>
);

export default App;
```

这个例子中，组件经由路由转发，`/` 转发给 `Home`，`/about` 转发给 `About`。

## RouteSwitch

JSX 的写法，对于熟悉 JSX 的开发来说，十分便捷，但需要开发来编写和维护，不符合 NocoBase 低代码、无代码的设计理念。所以将 Route 做了封装和配置化改造，如下：

```tsx
/**
 * defaultShowCode: true
 * title: RouteSwitch
 */
import React from 'react';
import { Link, MemoryRouter as Router } from 'react-router-dom';
import { RouteRedirectProps, RouteSwitchProvider, RouteSwitch } from '@nocobase/client';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

const routes: RouteRedirectProps[] = [
  {
    type: 'route',
    path: '/',
    exact: true,
    component: 'Home',
  },
  {
    type: 'route',
    path: '/about',
    component: 'About',
  },
];

export default () => {
  return (
    <RouteSwitchProvider components={{ Home, About }}>
      <Router initialEntries={['/']}>
        <Link to={'/'}>Home</Link>, <Link to={'/about'}>About</Link>
        <RouteSwitch routes={routes} />
      </Router>
    </RouteSwitchProvider>
  );
};
```

- components 由开发编写，以 Layout 或 Template 的方式提供给大家使用。有限的 Layout、Template 可以创造出无数的应用场景。
- routes 转化成了 json 的方式，方便存储，也可以进一步提供配置 route 的界面，以方便后续无代码的支持。

## SchemaComponent

路由配置化之后，可以注册诸多可供路由使用的组件模板，以方便各种场景支持，但是这些组件还是需要开发编写和维护，所以进一步将组件抽象，转换成配置化的方式。如：

```tsx
/**
 * defaultShowCode: true
 * title: Schema Component
 */
import React from 'react';
import { ISchema } from '@formily/react';
import { SchemaComponentProvider, SchemaComponent } from '@nocobase/client';

const schema: ISchema = {
  name: 'hello',
  'x-component': 'Hello',
  'x-component-props': {
    name: 'World',
  },
};

const Hello = ({ name }) => <h1>Hello {name}!</h1>;

export default function App() {
  return (
    <SchemaComponentProvider components={{ Hello }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  )
};
```

可以通过 schema 方式配置的组件，称之为 schema 组件。在 SchemaComponentProvider 里注册各种 JSX 组件，编写相应的 schema，再通过 SchemaComponent 渲染。SchemaComponent 的 schema 就是 Formily 的 [Schema](https://react.formilyjs.org/zh-CN/api/shared/schema)。实际上 SchemaComponent 就是 Formily 的 [SchemaField](https://react.formilyjs.org/zh-CN/api/components/schema-field)，之所以叫 SchemaComponent，是因为 SchemaComponent 可用于构建页面的各个部分，不局限于表单场景。

**思维转换：**

虽然 Formily 的核心是致力于解决表单的复杂问题，但是随着不断的演变，已经不局限在表单层面了。Formily 核心提供了 Form 和 Field 两个非常重要的模型，Form 提供了路径系统和联动模型也同样适用于页面视图，Field 实际上也可以理解为组件，分为有值组件和无值组件两类，有值组件例如 Input、Select 等，无值组件例如 Drawer、Button 等。有值组件的数值又可以分不同类型：String、Number、Boolean、Object、Array 等等，无值组件没有数值，所以用 Void 表示，和 Formily 的 Field、ArrayField、ObjectField、VoidField 都对应上了。

为了适应动态的配置化表单解决方案，Formily 又提炼了 Schema 协议（DSL），这个协议完全适用于描述组件模型，用类 JSON Schema 的语法描述组件结构和对应的数值类型，这个 Schema 也是 SchemaComponent 的重要组成部分。

- Schema 是一个树结构，多个节点以树形结构连接起来，其中的一个 property 表示的就是其中的一个 Schema 节点。
- 单 Schema 节点（不包括 properties）由核心 `x-component`、包装器 `x-decorator`、设计器 `x-designable` 三个组件构成。
  - `x-component` 核心组件参数
  - `x-decorator` 包装器，不同场景中，同一个核心组件，可能使用不同的包装器，如 FormItem、CardItem、BlockItem、Editable 等
  - `x-designable` NocoBase 的扩展参数，提供可以配置当前节点 schema 的表单。与 Formily 提供的 Designable 解决方案不同，`x-designable` 直接作用于当前 schema 节点，使用和配置不分离。

理论上，很多现有组件都可以直接转为 schema 组件，但是并不一定好用。以 Drawer 为例，常规 JSX 的写法一般是这样的：

```tsx
/**
 * defaultShowCode: true
 * title: JSX Drawer
 */
import React, { useState } from 'react';
import { Drawer, Button } from 'antd';

const App: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };
  return (
    <>
      <Button type="primary" onClick={showDrawer}>
        Open
      </Button>
      <Drawer 
        title="Basic Drawer" 
        placement="right" 
        onClose={onClose} 
        visible={visible} 
        footer={
          <Button onClick={onClose}>关闭</Button>
        }
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Drawer>
    </>
  );
};

export default App;
```

将组件转换成 schema，如果 1:1 转换是这样的：

```tsx
/**
 * defaultShowCode: true
 * title: Drawer Schema
 */
import React, { useMemo } from 'react';
import { SchemaComponentProvider, SchemaComponent } from '@nocobase/client';
import { Drawer as AntdDrawer, Button } from 'antd';
import { createForm } from '@formily/core';
import { RecursionField } from '@formily/react';

const Drawer = (props) => {
  const { footerSchema, ...others } = props;
  return (
    <AntdDrawer
      footer={
        footerSchema && <RecursionField schema={footerSchema} onlyRenderProperties />
      }
      {...others}
    />
  );
};

const schema = {
  type: 'object',
  properties: {
    b1: {
      type: 'void',
      'x-component': 'Button',
      'x-component-props': {
        children: 'Open',
        type: 'primary',
        onClick: '{{showDrawer}}',
      },
    },
    d1: {
      type: 'void',
      'x-component': 'Drawer',
      'x-component-props': {
        title: 'Basic Drawer',
        onClose: '{{onClose}}',
        footerSchema: {
          type: 'object',
          properties: {
            fb1: {
              type: 'void',
              'x-component': 'Button',
              'x-component-props': {
                children: 'Close',
                onClick: '{{onClose}}',
              },
            },
          },
        },
      },
    },
  },
};

export default function App() {
  const form = useMemo(() => createForm(), []);
  const showDrawer = () => {
    form.query('d1').take((field) => {
      field.componentProps.visible = true;
    });
  };
  const onClose = () => {
    form.query('d1').take((field) => {
      field.componentProps.visible = false;
    });
  };
  return (
    <SchemaComponentProvider 
      form={form} 
      components={{ Drawer, Button }}
    >
      <SchemaComponent schema={schema} scope={{ showDrawer, onClose }} />
    </SchemaComponentProvider>
  );
}
```

这个例子讲述了怎么将组件转换为可 Schema 配置，虽然达成了某种效果，但并不是一个很好的示例。

- 一个 property 就是一个 Schema 节点，Drawer 的 Schema 由平行的两个 schema 节点组成；
- 需要额外的自定义 scope 支持 drawer 组件 visible 的状态管理，这里自定义的 scope 复用性差；
- footer 需要特殊处理。在 x-component-props 里加了个 footerSchema 参数。但这个 footerSchema 并不是一个常规的 schema 节点，因为不是在 properties 里，不利于后端 schema 存储的统一规划；
- 删除 drawer，需要删除两个 schema 节点；
- 后端如何输出 drawer 这部分的 schema 也非常不方便，因为 drawer 由平行的两个节点组成。

为了解决上述问题，从结构上做了一些改良：

```ts
{
  type: 'object',
  properties: {
    a1: {
      'x-component': 'Action',
      title: 'Open',
      properties: {
        d1: {
          'x-component': 'Action.Drawer',
          title: 'Drawer Title',
          properties: {
            c1: {
              'x-content': 'Hello',
            },
            f1: {
              'x-component': 'Action.Drawer.Footer',
              properties: {
                a1: {
                  'x-component': 'Action',
                  title: 'Close',
                  'x-component-props': {
                    useAction: '{{ useCloseAction }}',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
```

以上示例，自定义了一个 Action 组件，用于配置按钮操作，又扩展了 Action.Drawer 和 Action.Drawer.Footer 两个特殊节点，分别用于配置抽屉弹框和抽屉的 footer。以上 schema 是个标准的组件树结构，层次十分分明。组件树的各个节点层次分明，schema 的增删改查就完全是标准流程了。

- 查询 Drawer 的 schema，只需要把 a1 节点的 json 全部输出就可以。
- 修改各个节点和子节点都可以单节点独立处理，逻辑一致。
- 删除时，直接删除不需要的节点就可以了。
- 有利于扩展，比如继续增加 Action.Modal、Action.Modal.Footer 两个节点用于配置对话框。

Action.Drawer 完整的例子如下：

```tsx
/**
 * title: Action.Drawer
 */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Drawer } from 'antd';
import { SchemaComponentProvider, SchemaComponent } from '@nocobase/client';
import { observer, RecursionField, useField, useFieldSchema, ISchema } from '@formily/react';

const VisibleContext = createContext(null);

const useA = () => {
  return {
    async run() {},
  };
};

function useCloseAction() {
  const [, setVisible] = useContext(VisibleContext);
  return {
    async run() {
      setVisible(false);
    },
  };
}

const Action: any = observer((props: any) => {
  const { useAction = useA, onClick, ...others } = props;
  const [visible, setVisible] = useState(false);
  const schema = useFieldSchema();
  const field = useField();
  const { run } = useAction();
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <Button
        {...others}
        onClick={() => {
          onClick && onClick();
          setVisible(true);
          run();
        }}
      >
        {schema.title}
      </Button>
      <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />
    </VisibleContext.Provider>
  );
});

Action.Drawer = observer((props: any) => {
  const [visible, setVisible] = useContext(VisibleContext);
  const schema = useFieldSchema();
  const field = useField();
  return (
    <>
      {createPortal(
        <Drawer
          title={schema.title}
          visible={visible}
          onClose={() => setVisible(false)}
          footer={
            <RecursionField
              basePath={field.address}
              schema={schema}
              onlyRenderProperties
              filterProperties={(s) => {
                return s['x-component'] === 'Action.Drawer.Footer';
              }}
            />
          }
        >
          <RecursionField
            basePath={field.address}
            schema={schema}
            onlyRenderProperties
            filterProperties={(s) => {
              return s['x-component'] !== 'Action.Drawer.Footer';
            }}
          />
        </Drawer>,
        document.body,
      )}
    </>
  );
});

Action.Drawer.Footer = observer((props: any) => {
  const field = useField();
  const schema = useFieldSchema();
  return <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
});

const schema: ISchema = {
  type: 'object',
  properties: {
    a1: {
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
      },
      title: 'Open',
      properties: {
        d1: {
          'x-component': 'Action.Drawer',
          title: 'Drawer Title',
          properties: {
            c1: {
              'x-content': 'Hello',
            },
            f1: {
              'x-component': 'Action.Drawer.Footer',
              properties: {
                a1: {
                  'x-component': 'Action',
                  title: 'Close',
                  'x-component-props': {
                    useAction: '{{ useCloseAction }}',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ Action }} scope={{ useCloseAction }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
```
