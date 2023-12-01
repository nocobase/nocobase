# SchemaInitializer

## new SchemaInitializer(options)

```tsx | pure
interface SchemaInitializerOptions<P1 = ButtonProps, P2 = {}> {
  Component?: ComponentType<P1>;
  componentProps?: P1;
  style?: React.CSSProperties;
  title?: string;
  icon?: ReactNode;

  items?: SchemaInitializerItemType[];
  ItemsComponent?: ComponentType<P2>;
  itemsComponentProps?: P2;
  itemsComponentStyle?: React.CSSProperties;

  insertPosition?: 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd';
  designable?: boolean;
  wrap?: (s: ISchema) => ISchema;
  onSuccess?: (data: any) => void;
  insert?: InsertType;
  useInsert?: () => InsertType;

  popover?: boolean;
  popoverProps?: PopoverProps;
}

class SchemaInitializer<P1 = ButtonProps, P2 = {}> {
    constructor(options: SchemaInitializerOptions<P1, P2> & { name: string }): SchemaInitializer<P1, P2>;
    add(name: string, item: Omit<SchemaInitializerItemType, 'name'>): void
    get(nestedName: string): SchemaInitializerItemType | undefined
    remove(nestedName: string): void
}
```

### 详细解释

![](../static/KTUWb69kioUg8bxYTAMc2ReDnRg.png)

- name：唯一标识，必填
- Component 相关

  - Component：触发组件，默认是 `Button` 组件
  - componentProps: 组件属性，默认是 `ButtonProps`
  - title： 按钮的文本
  - icon：按钮的 icon 属性
  - style：组件的样式
- Items 相关

  - items：列表项配置
  - ItemsComponent：默认是渲染成一个列表的形式，可通过此参数自定义 items
  - itemsComponentProps：`ItemsComponent` 的属性
  - itemsComponentStyle：`ItemsComponent` 的样式
- popover 组件相关

  - popover：是否使用 popover，默认为 `true`
  - popoverProps：popover 的属性
- Schema 操作相关

  - insertPosition：插入位置，参考：[useDesignable()](/core/ui-schema/designable#usedesignable)
  - designable：是否显示设计模式，参考：[useDesignable()](/core/ui-schema/designable#usedesignable)
  - wrap：对 Schema 的二次处理，参考：[useDesignable()](/core/ui-schema/designable#usedesignable)
  - onSuccess：Schema 更新到服务端后的回调，参考：[useDesignable()](/core/ui-schema/designable#usedesignable)
  - insert：自定义 Schema 插入逻辑，默认为 [useDesignable()](/core/ui-schema/designable#usedesignable) 的 `insertAdjacent`
  - useInsert：当自定义插入 Schema 的逻辑需要用到 Hooks 时，可以使用此参数

### 示例

#### 基础用法

```tsx | pure
const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Add Block',
  // 插入位置
  insertPosition: 'beforeEnd',
  items: [
    {
      name: 'a',
      title: 'Item A',
      Component: Demo,
    },
  ],
});
```


<code src="./demos/schema-initializer-basic.tsx"></code>

#### 定制化 `Component`

```tsx | pure
const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  Component: (props) => (
    <Avatar style={{ cursor: 'pointer' }} {...props}>
      C
    </Avatar>
  ),
  componentProps: {
    size: 'large',
  },
  items: [
    {
      name: 'a',
      title: 'Item A',
      Component: Demo,
    }
  ],
});
```

<code src="./demos/schema-initializer-component.tsx"></code>

#### 不使用 Popover

关于 `useDesignable()` 的说明请参考 [useDesignable](/core/ui-schema/designable#usedesignable)。

```tsx | pure
const schema = {
  type: 'void',
  title: Math.random(),
  'x-component': 'Hello',
};
const MyInitializerComponent = () => {
    const { insertBeforeEnd } = useDesignable();
    return <Button onClick={() => insertBeforeEnd(schema)}>Add block</Button>
}

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Add block',
  popover: false,
  Component: MyInitializerComponent,
});
```

<code src="./demos/schema-initializer-popover.tsx"></code>


#### 定制化 Items

```tsx | pure
const CustomListGridMenu: FC<SchemaInitializerItemsProps<ButtonProps, ListProps<any>>> = (props) => {
  const { items, options, ...others } = props;
  return (
    <List
      {...others}
      style={{ marginTop: 20 }}
      dataSource={items}
      grid={{ gutter: 16, column: 2 }}
      renderItem={(item) => (
        <List.Item style={{ minWidth: 100, textAlign: 'center' }}>
          <SchemaInitializerChild {...item} />
        </List.Item>
      )}
    ></List>
  );
};

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  ItemsComponent: CustomListGridMenu,
  items: [
    {
      name: 'a',
      title: 'Item A',
      Component: Demo,
    }
  ],
});
```

<code src="./demos/schema-initializer-items.tsx"></code>

## options.items 配置详解

### 类型

```tsx | pure
interface SchemaInitializerComponentCommonProps {
  title?: string;
  schema?: ISchema;
  style?: React.CSSProperties;
  className?: string;
}

interface SchemaInitializerItemBaseType<T = {}> extends SchemaInitializerComponentCommonProps {
  name: string;
  sort?: number;
  type?: string;
  Component?: string | ComponentType<T>;
  componentProps?: Omit<T, 'children'>;
  useComponentProps?: () => Omit<T, 'children'>;
  useVisible?: () => boolean;
  children?: SchemaInitializerItemType[];
  useChildren?: () => SchemaInitializerItemType[];
  [index: string]: any;
}
```

### 两种定义方式：`Component` 和 `type`


- 通过 `Component` 定义

```tsx | pure

const Demo = () => {
  // 最终渲染 `SchemaInitializerItem`
  return <SchemaInitializerItem title='Demo' />
}

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  items: [
    {
      name: 'a',
      Component: Demo, // 通过 Component 定义
    }
  ],
});
```

- 通过 `type` 定义

NocoBase 内置了一些常用的 `type`，例如 `type: 'item'`，相当于 `Component: SchemaInitializerItem`。

更多内置类型，请参考：[内置组件和类型](/core/ui-schema/schema-initializer#%E5%86%85%E7%BD%AE%E7%BB%84%E4%BB%B6%E5%92%8C%E7%B1%BB%E5%9E%8B)

```tsx | pure
const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  items: [
    {
      name: 'a',
      type: 'item',
      title: 'Demo'
    }
  ],
});
```

<code src="./demos/schema-initializer-options-item-define.tsx"></code>

### `children` 和动态方式 `useChildren`

对于某些组件而言是有子列表项的，例如 `type: 'itemGroup'`，那么我们使用 children 属性，同时考虑到某些场景下 children 是动态的，需要从 Hooks 里面获取，那么就可以通过 `useChildren` 来定义。

<code src="./demos/schema-initializer-options-item-children.tsx"></code>

### 动态显示隐藏 `useVisible`

<code src="./demos/schema-initializer-options-item-visible.tsx"></code>

### 组件属性 `componentProps` 和动态属性 `useComponentProps`

对于一些通用组件，我们可以通过 `componentProps` 来定义组件属性，同时考虑到某些场景下组件属性是动态的，需要从 Hooks 里面获取，那么就可以通过 `useComponentProps` 来定义。

当然也可以不使用这两个属性，直接封装成一个组件，然后通过 `Component` 来定义。

<code src="./demos/schema-initializer-options-item-props.tsx"></code>

### 公共属性和组件属性

```tsx | pure
{
  name: 'demo',
  title: 'Demo',
  foo: 'bar',
  Component: Demo,
  componentProps: {
    zzz: 'xxx',
  },
}
```

从上面的示例中我么看到，从配置项中获取组件组件所需的数据有两个方式：

- 组件属性：通过 `componentProps` 来定义，例如 `zzz: 'xxx'`
- 公共属性：将属性直接定义在配置项上，例如 `foo: 'bar'`、`name`、`title`

在获取上

- `componentProps` 定义的数据会被传递给组件的 `props`
- 直接定义在配置项上的数据会则需要通过 [useSchemaInitializerItem()](/core/ui-schema/schema-initializer#useschemainitializeritem) 获取

```tsx | pure
const Demo = (props) => {
  console.log(props); // { zzz: 'xxx' }
  const { foo } = useSchemaInitializerItem(); // { foo: 'bar' }
}
```

## 实例方法

```tsx | pure
const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      title: 'item a',
      type: 'itemGroup',
      children: [
          {
              name: 'a1',
              title: 'item a1',
          }
      ],
    },
  ],
});
```

```tsx
import { SchemaInitializer, Application, useSchemaInitializerRender } from '@nocobase/client';
const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      title: 'item a',
      type: 'itemGroup',
      children: [
          {
              name: 'a1',
              title: 'item a1',
              type: 'item',
          }
      ],
    },
  ],
});

const Root = () => {
  const { render } = useSchemaInitializerRender('MyInitializer');
  return render();
}
const app = new Application({
  schemaInitializers: [myInitializer],
  providers: [Root],
  designable: true,
});

export default app.getRootComponent();
```

### schemaInitializer.add()

用于新增 Item，另一种添加方式参考 [schemaInitializerManager.addItem()](/core/ui-schema/schema-initializer-manager#schemainitializermanageradditem);

- 类型

```tsx | pure
class SchemaInitializer {
    add(name: string, item: Omit<SchemaInitializerItemType, 'name'>): void
}
```

- 参数说明

第一个参数是 name，作为唯一标识，用于增删改查，并且 `name` 支持 `.` 用于分割层级。

- 示例

```tsx | pure
myInitializer.add('b', {
    type: 'item',
    title: 'item b',
})

myInitializer.add('a.a2', {
    type: 'item',
    title: 'item a2',
})
```

```tsx
import { SchemaInitializer, Application, useSchemaInitializerRender } from '@nocobase/client';
const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      title: 'item a',
      type: 'itemGroup',
      children: [
          {
              name: 'a1',
              title: 'item a1',
              type: 'item',
          }
      ],
    },
  ],
});

myInitializer.add('b', {
    type: 'item',
    title: 'item b',
})

myInitializer.add('a.a2', {
    type: 'item',
    title: 'item a2',
})

const Root = () => {
  const { render } = useSchemaInitializerRender('MyInitializer');
  return render();
}
const app = new Application({
  schemaInitializers: [myInitializer],
  providers: [Root],
  designable: true,
});


export default app.getRootComponent();
```


### schemaInitializer.get()

- 类型

```tsx | pure
class SchemaInitializer {
    get(nestedName: string): SchemaInitializerItemType | undefined
}
```

- 示例

```tsx | pure
const itemA = myInitializer.get('a')

const itemA1 = myInitializer.add('a.a1')
```

### schemaInitializer.remove()

另一种移除方式参考 [schemaInitializerManager.addItem()](/core/ui-schema/schema-initializer-manager#schemainitializermanagerremoveitem);

- 类型

```tsx | pure
class SchemaInitializer {
    remove(nestedName: string): void
}
```

- 示例

```tsx | pure
myInitializer.remove('a.a1')

myInitializer.remove('a')
```

## Hooks

### useSchemaInitializer()

用于获取 `SchemaInitializer` 上下文内容。

- 类型

```tsx | pure
export type InsertType = (s: ISchema) => void;

const useSchemaInitializer: () => {
    insert: InsertType;
    options: SchemaInitializerOptions<any>;
    visible?: boolean;
    setVisible?: (v: boolean) => void;
}
```

- 参数详解
  - `insert`：参数是 Schema 对象，用于插入 Schema
  - `options`：获取 `new SchemaInitializer(options)` 时 options 配置
  - `visible`：popover 是否显示
  - `setVisible`：设置 popover 显示状态

- 示例

```tsx | pure
const schema = {
  type: 'void',
  'x-component': 'Hello',
}
const Demo = () => {
    const { insert } = useSchemaInitializer();
     const handleClick = () => {
      insert(schema);
    };
    return  <SchemaInitializerItem title={'Demo'} onClick={handleClick}></SchemaInitializerItem>;
}
```

### useSchemaInitializerRender()

用于渲染 `SchemaInitializer`。

- 类型

```tsx | pure
function useSchemaInitializerRender(name: string, options?: SchemaInitializerOptions): {
    exists: boolean;
    render: (props?: SchemaInitializerOptions) => React.FunctionComponentElement;
}
```

- 参数详解

返回的 `render` 方法可以接收一个参数，用于覆盖 `new SchemaInitializer(options)` 的 `options` 配置。

- 示例

```tsx | pure
const Demo = () => {
    const filedSchema = useFieldSchema();
    const { render } = useSchemaInitializerRender(fieldSchema['x-initializer'], fieldSchema['x-initializer-props']);
    return <div>
        <div>{ render() }</div>
        <div>可以进行参数的二次覆盖：{ render({ style: { color: 'red' } }) }</div>
    </div>
}
```

<code src="./demos/schema-initializer-render.tsx"></code>

### useSchemaInitializerItem()

用于获取配置项内容的，配置项是指的 `SchemaInitializer` 中的 `items` 中的一项。

- 类型

```tsx | pure
const useSchemaInitializerItem: <T = any>() => T
```

- 示例

```tsx | pure
const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      title: 'Item A',
      foo: 'bar',
      Component: Demo,
    },
  ],
});

/**
 * 通过 useSchemaInitializerItem() 获取到的是
 *  {
 *    name: 'a',
 *    title: 'Item A',
 *    foo: 'bar',
 *    Component: Demo,
 * }
 */
const Demo = () => {
  const { title, foo } = useSchemaInitializerItem();
  return <div>{ title } - { foo }</div>
}
```

<code src="./demos/schema-initializer-hooks-item.tsx"></code>

## 内置组件和类型

| type        | Component                      | 效果                                      |
| ----------- | ------------------------------ | ----------------------------------------- |
| item        | SchemaInitializerItem            | 文本|
| itemGroup   | SchemaInitializerItemGroup       | 分组，同 antd `Menu` 组件的 `type: 'group'`      |
| subMenu     | SchemaInitializerSubMenu         | 子菜单，同 antd `Menu` 组件的子菜单              |
| divider     | SchemaInitializerDivider         | 分割线，同 antd `Menu` 组件的  `type: 'divider'` |
| switch      | SchemaInitializerSwitch      | 开关                                      |
| actionModal      | SchemaInitializerActionModal      | 弹窗|

以下每个示例都提供了 2 种[定义方式](/core/ui-schema/schema-initializer#两种定义方式component-和-type)，一种是通过 `Component` 定义，另一种是通过 `type` 定义。

### `type: 'item'` & `SchemaInitializerItem`

文本项。

```tsx | pure
interface SchemaInitializerItemProps {
  style?: React.CSSProperties;
  className?: string;
  name?: string;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  items?: SchemaInitializerItemType[];
  onClick?: (args?: any) => any;
}
```

核心参数是 `title`、`icon`、`onClick`、`items`，其中 `onClick` 用于插入 Schema，`items` 用于渲染子列表项。

<code src="./demos/schema-initializer-components-item.tsx"></code>

### `type: 'itemGroup'` & SchemaInitializerItemGroup

分组。

```tsx | pure
interface SchemaInitializerItemGroupProps {
  name: string;
  title: string;
  children?: SchemaInitializerOptions['items'];
  divider?: boolean;
}
```

核心参数是 `title`、`children`，其中 `children` 用于渲染子列表项，`divider` 用于渲染分割线。

<code src="./demos/schema-initializer-components-group.tsx"></code>

### `type: 'switch'` & SchemaInitializerSwitch

Switch 切换按钮。

```tsx | pure
interface SchemaInitializerSwitchItemProps extends SchemaInitializerItemProps {
  checked?: boolean;
  disabled?: boolean;
}
```

核心参数是 `checked`、`onClick`，其中 `onClick` 用于插入或者移除 Schema。

<code src="./demos/schema-initializer-components-switch.tsx"></code>

### `type: 'subMenu'` &  SchemaInitializerSubMenu

子菜单。

<code src="./demos/schema-initializer-components-menu.tsx"></code>

### `type: 'divider'` & SchemaInitializerDivider

分割线。

<code src="./demos/schema-initializer-components-divider.tsx"></code>

## 渲染组件

### SchemaInitializerChildren

用于自定义渲染多个列表项。

```tsx | pure

const Demo = ({ children }) => {
  // children: [{ name: 'a1', Component: ItemA1 }, { name: 'a2', type: 'item', title: 'ItemA2' }]
  return <SchemaInitializerChildren>{ children }</SchemaInitializerChildren>
}

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'test',
      Component: Demo,
      children: [
        {
          name: 'a1',
          Component: ItemA1,
        },
        {
          name: 'a2',
          type: 'item',
          title: 'ItemA2',
        }
      ]
    }
  ],
});
```

### SchemaInitializerChild

用于自定义渲染单个列表项。

```tsx | pure
const Demo = (props) => {
  return <SchemaInitializerChild {...props}/>
}
```
