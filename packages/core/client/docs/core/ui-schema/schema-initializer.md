# SchemaInitializer

## new SchemaInitializer(options)

```tsx | pure
export interface SchemaInitializerOptions<P1 = ButtonProps, P2 = {}> {
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

返回的 `render` 方法可以接收一个参数，用于覆盖 `SchemaInitializer` 的配置。

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


## 列表项组件

| type        | Component                      | 效果                                      |
| ----------- | ------------------------------ | ----------------------------------------- |
| item        | SchemaInitializerItem            | 文本                                      |
| itemGroup   | SchemaInitializerGroup       | 分组，同 Menu 组件的 `type: 'group'`      |
| subMenu     | SchemaInitializerMenu         | 子菜单，同 Menu 组件的子菜单              |
| divider     | SchemaInitializerDivider         | 分割线，同 Menu 组件的  `type: 'divider'` |
| select      | SchemaInitializerSelect      | 下拉选择                                  |
| switch      | SchemaInitializerSwitch      | 开关                                      |


### SchemaInitializerItem
文本项。

```tsx | pure
const PageInitializerItem = () => {
  const { insert } = useSchemaInitializer();

  const handleClick = () => {
    insert(schema)
  }

  return <SchemaInitializerItem title={'Page'} onClick={handleClick} />
}

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      Component: PageInitializerItem,
    }
  ],
});
```

### SchemaInitializerGroup

分组。

```tsx | pure
const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      title: 'Group Title',
      type: 'itemGroup',  // 等同于 Component: SchemaInitializerGroup
      children: [
        {
          name: 'a1',
          Component: ItemA1,
        },
        {
          name: 'a2',
          Component: ItemA2,
        }
      ],
    }
  ],
});
```

### SchemaInitializerDivider

分割线。

```tsx | pure
const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'divider',
      type: 'divider',  // 等同于 Component: SchemaInitializerDivider
    }
  ],
});
```

### SchemaInitializerMenu

子菜单。

```tsx | pure
const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      title: 'Menu Title',
      type: 'subMenu',  // 等同于 Component: SchemaInitializerMenu
      children: [
        {
          name: 'a1',
          Component: ItemA1,
        },
        {
          name: 'a2',
          Component: ItemA2,
        }
      ],
    }
  ],
});
```

### SchemaInitializerSelect

选择器选项。

```tsx | pure
const OpenModeSelect = () => {
  const { insert } = useSchemaInitializer();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const openModeValue = fieldSchema?.['x-component-props']?.['openMode'] || 'drawer';
  const { patch } = useDesignable();

  const handleChange = (value) => {
    // 修改 Schema 的属性
    patch({
      'x-component-props': {
        openMode: value,
      }
    })
  }

  return <SchemaInitializerSelect
    title={'Open mode'}
    options={[
      { label: 'Drawer', value: 'drawer' },
      { label: 'Dialog', value: 'modal' },
    ]}
    value={openModeValue}
    onChange={handleChange}
  />
}

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'openMode',
      Component: OpenModeSelect,
    }
  ],
});
```

### SchemaInitializerSwitch

Switch 切换按钮。

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
