---
order: 1
---

# 客户端内核

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/5be7ebc2f47effef85be7a0c75cf76f9.png" style="max-width: 800px;" />

示例：

```tsx | pure
const app = new Application();

app.use([MemoryRouter, { initialEntries: ['/'] }]);

app.use(({ children }) => {
  const location = useLocation();
  if (location.pathname === '/hello') {
    return <div>Hello NocoBase!</div>;
  }
  return children;
});

export default app.compose();
```

## RouteSwitch

稍微复杂的应用都会用到路由来管理前端的页面，如下：

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

上述例子，组件经由路由转发，`/` 转发给 `Home`，`/about` 转发给 `About`。这种 JSX 的写法，对于熟悉 JSX 的开发来说，十分便捷，但需要开发来编写和维护，不符合 NocoBase 低代码、无代码的设计理念。所以将 Route 做了封装和配置化改造，如下：

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

- 由 RouteSwitchProvider 配置 components，由开发编写，以 Layout 或 Template 的方式提供给 RouteSwitch 使用。
- 由 RouteSwitch 配置 routes，JSON 的方式，可以由后端获取，方便后续的动态化、无代码的支持。

## SchemaComponent

路由可以通过 JSON 的方式配置，可以注册诸多可供路由使用的组件模板，以方便各种场景支持，但是这些组件还是需要开发编写和维护，所以进一步将组件抽象，转换成配置化的方式。如：

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
  - `x-component` 核心组件
  - `x-decorator` 包装器，不同场景中，同一个核心组件，可能使用不同的包装器，如 FormItem、CardItem、BlockItem、Editable 等
  - `x-designable` 节点设计器（NocoBase 的扩展参数），一般为当前 schema 节点的配置表单。与 Formily 提供的 Designable 解决方案不同，`x-designable` 直接作用于当前 schema 节点，使用和配置不分离。

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

- 一个 property 就是一个 Schema 节点，Drawer 的 Schema 由平行的两个 schema 节点组成，不利于管理；
- 需要额外的自定义 scope 支持 drawer 组件 visible 的状态管理，而且这里自定义的 scope 复用性差；
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

## RouteSwitch + SchemaComponent

当路由和组件都可以配置之后，可以进一步将二者结合，例子如下：

```tsx
/**
 * defaultShowCode: true
 * title: RouteSwitch + SchemaComponent
 */
import React, { useMemo, useEffect } from 'react';
import { Link, MemoryRouter as Router } from 'react-router-dom';
import {
  RouteRedirectProps,
  RouteSwitchProvider,
  RouteSwitch,
  useRoute,
  SchemaComponentProvider,
  SchemaComponent,
  useDesignable,
  useSchemaComponentContext,
} from '@nocobase/client';
import { Spin, Button } from 'antd';
import { observer, Schema } from '@formily/react';

const Hello = observer(({ name }) => {
  const { patch, remove } = useDesignable();
  return (
    <div>
      <h1>Hello {name}!</h1>
      <Button
        onClick={() => {
          patch('x-component-props.name', Math.random());
        }}
      >更新</Button>
    </div>
  )
});

const RouteSchemaComponent = (props) => {
  const route = useRoute();
  const { reset } = useSchemaComponentContext();
  useEffect(() => {
    reset();
  }, route.schema);
  return <SchemaComponent schema={route.schema}/>
}

const routes: RouteRedirectProps[] = [
  {
    type: 'route',
    path: '/',
    exact: true,
    component: 'RouteSchemaComponent',
    schema: {
      name: 'home',
      'x-component': 'Hello',
      'x-component-props': {
        name: 'Home',
      },
    },
  },
  {
    type: 'route',
    path: '/about',
    component: 'RouteSchemaComponent',
    schema: {
      name: 'home',
      'x-component': 'Hello',
      'x-component-props': {
        name: 'About',
      },
    },
  },
];

export default () => {
  return (
    <SchemaComponentProvider components={{ Hello }}>
      <RouteSwitchProvider components={{ RouteSchemaComponent }}>
        <Router initialEntries={['/']}>
          <Link to={'/'}>Home</Link>, <Link to={'/about'}>About</Link>
          <RouteSwitch routes={routes} />
        </Router>
      </RouteSwitchProvider>
    </SchemaComponentProvider>
  );
};
```

以上例子实现了路由和组件层面的配置化，在开发层面配置了两个组件：

- `<RouteSchemaComponent/>` 简易的可以在路由里配置 schema 的方案
- `<Hello/>` 自定义的 Schema 组件

为了让大家更加能感受到 Schema 组件的不一样之处，例子添加了一个简易的随机更新 `x-component-props.name` 值的按钮，当路由切换后，更新后的 name 并不会被重置。这也是 Schema 组件的 Designable 的能力，可以任意的动态更新 schema 配置，实时更新，实时渲染。

## Designable

SchemaComponent 基于 Formily 的 SchemaField，Formily 提供了 [Designable](https://github.com/alibaba/designable) 来解决 Schema 的配置问题，但是这套方案：

- 需要维护两套代码，以 antd 为例，需要同时维护 @formily/antd 和 @designable/formily-antd 两套代码
- 使用和设计分离，在设计器界面表单无法正常工作

另辟蹊径，NocoBase 构想了一种更为便捷的配置方案，使用和配置也可以兼顾，只需要维护一套代码。为此，提炼了一个简易的 `useDesignable()` Hook，可用于任意 Schema 组件中，动态配置 Schema，实时更新，实时渲染。

Hook API：

```ts
const {
  designable,         // 是否可以配置
  patch,              // 更新当前节点配置
  remove,             // 移除当前节点
  insertAdjacent,     // 在当前节点的相邻位置插入，四个位置：beforeBegin、afterBegin、beforeEnd、afterEnd
  insertBeforeBegin,  // 在当前节点的前面插入
  insertAfterBegin,   // 在当前节点的第一个子节点前面插入
  insertBeforeEnd,    // 在当前节点的最后一个子节点后面
  insertAfterEnd,     // 在当前节点的后面
} = useDesignable();

const schema = {
  'x-component': 'Hello',
};

// 在当前节点的前面插入
insertBeforeBegin(schema);
// 等同于
insertAdjacent('beforeBegin', schema);

// 在当前节点的第一个子节点前面插入
insertAfterBegin(schema);
// 等同于
insertAdjacent('afterBegin', schema);

// 在当前节点的最后一个子节点后面
insertBeforeEnd(schema);
// 等同于
insertAdjacent('beforeEnd', schema);

// 在当前节点的后面
insertAfterEnd(schema);
// 等同于
insertAdjacent('afterEnd', schema);
```

insertAdjacent 的几个插入的位置：

```ts
{
  properties: {
    // beforeBegin 在当前节点的前面插入
    node1: {
      properties: {
        // afterBegin 在当前节点的第一个子节点前面插入
        // ...
        // beforeEnd 在当前节点的最后一个子节点后面
      },
    },
    // afterEnd 在当前节点的后面
  },
}
```

并不是所有场景都能使用 hook，所以提供了 `createDesignable()` 方法（实际上 `useDesignable()` 也是基于它来实现）：

```ts
const dn = createDesignable({
  current: schema,
});

dn.on('afterInsertAdjacent', (position, schema) => {

});

dn.insertAfterEnd(schema);
```

相关例子如下：

<code src="./src/schema-component/demos/demo1.tsx" />

insertAdjacent 操作不仅可以用于新增节点，也可以用于现有节点的位置移动，如以下拖拽排序的例子：

```tsx
/**
 * title: 拖拽排序
 */
import React from 'react';
import { uid } from '@formily/shared';
import { observer, useField, useFieldSchema } from '@formily/react';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { SchemaComponent, SchemaComponentProvider, createDesignable, useDesignable } from '@nocobase/client';

const useDragEnd = () => {
  const { refresh } = useDesignable();

  return ({ active, over }: DragEndEvent) => {
    const activeSchema = active?.data?.current?.schema;
    const overSchema = over?.data?.current?.schema;

    if (!activeSchema || !overSchema) {
      return;
    }

    const dn = createDesignable({
      current: overSchema,
    });

    dn.on('afterInsertAdjacent', refresh);
    dn.insertBeforeBeginOrAfterEnd(activeSchema);
  };
};

const Page = observer((props) => {
  return <DndContext onDragEnd={useDragEnd()}>{props.children}</DndContext>;
});

function Draggable(props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
    data: props.data,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}

function Droppable(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: props.data,
  });
  const style = {
    color: isOver ? 'green' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}

const Block = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  return (
    <Droppable id={field.address.toString()} data={{ schema: fieldSchema }}>
      <div style={{ marginBottom: 20, padding: '20px', background: '#f1f1f1' }}>
        Block {fieldSchema.name}{' '}
        <Draggable id={field.address.toString()} data={{ schema: fieldSchema }}>
          Drag
        </Draggable>
      </div>
    </Droppable>
  );
});

export default function App() {
  return (
    <SchemaComponentProvider components={{ Page, Block }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'Page',
          properties: {
            block1: {
              'x-component': 'Block',
            },
            block2: {
              'x-component': 'Block',
            },
            block3: {
              'x-component': 'Block',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
}
```

## APIClient

在 WEB 应用里，客户端请求无处不在。为了便于客户端请求，提供的 API 有：

- APIClient：客户端 SDK
- APIClientProvider：提供 APIClient 实例的 Context，全局共享
- useRequest()：需要结合 APIClientProvider 来使用
- useApiClient()：获取到当前配置的 apiClient 实例

```tsx | pure
const api = new APIClient({
  request, // 将 request 抛出去，方便各种自定义适配
});
api.request(options);
api.resource(name);

<APIClientProvider apiClient={api}>
  {/* children */}
</APIClientProvider>
```

useRequest() 需要结合 APIClientProvider 一起使用，是对 ahooks 的 useRequest 的封装，支持 resource 请求。

```ts
const { data, loading } = useRequest();
```


## Providers

客户端的扩展以 Providers 的形式存在，提供各种可供组件使用的 Context，可全局也可以局部使用。上文我们已经介绍了核心的三个 Providers：

- RouteSwitchProvider，提供配置路由所需的 Layout 和 Template 组件
- SchemaComponentProvider，提供配置 Schema 所需的各种组件
- ApiClientProvider，提供客户端 SDK

除此之外，还有：

- Router，实际也是 Provider，提供 History 的 Context，对应的有 BrowserRouter，HashRouter、MemoryRouter、NativeRouter、StaticRouter 几种可选方案
- AntdConfigProvider，为 antd 组件提供统一的全局化配置
- I18nextProvider，提供国际化解决方案
- ACLProvider，提供权限配置，plugin-acl 的前端模块
- CollectionManagerProvider，提供全局的数据表配置，plugin-collection-manager 的前端模块
- SystemSettingsProvider，提供系统设置，plugin-system-settings 的前端模块
- 其他扩展

多个 Providers 需要嵌套使用：

```tsx | pure
<ApiClientProvider>
  <SchemaComponentProvider>
    <RouteSwitchProvider>
      {...}
    </RouteSwitchProvider>
  </SchemaComponentProvider>
</ApiClientProvider>
```

但是这样的方式不利于 Providers 的管理和扩展，为此提炼了 `compose()` 函数用于配置多个 providers，如下：

<code defaultShowCode="true" titile="compose" src="./src/application/demos/demo1/index.tsx"/>

## Application

上文例子的 Providers 还是差点意思，再进一步封装改造：

```tsx | pure
const app = new Application({});

app.use(ApiClientProvider);
app.use([SchemaComponentProvider, { components: { Hello } }]);
app.use((props) => {
  return (
    <div>
      <Link to={'/'}>Home</Link>,<Link to={'/about'}>About</Link>
      <RouteSwitch routes={routes} />
    </div>
  );
});

app.mount('#root');
// 等于
ReactDOM.render(<App/>, document.getElementById('root'));
```

对比 NocoBase Server Application 中间件的核心实现：

```ts
app.use((ctx, next) => {});
const ctx = this.createContext(req, res)
await compose(app.middleware)(ctx);
await respond(ctx);
```

通过 app.use() 方法注册各种中间件插件，最后由 compose 来处理中间件，如果有需要也可以往 app.context 里添加各种东西待用。前端在处理 Provider 时也是类似的机制，这也是为什么客户端的扩展是以 Provider 的形式存在的原因。

从例子来看，以 Provider 的形式扩展是个不错的方案，但是还有两个问题没有解决：

- Provider 的顺序怎么处理
- 如何动态的加载前端模块

未完待续...