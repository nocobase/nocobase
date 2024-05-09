# SchemaSettings

## new SchemaSettings(options)

Create a SchemaSettings instance.

```tsx | pure
interface SchemaSettingsOptions<T = {}> {
  name: string;
  Component?: ComponentType<T>;
  componentProps?: T;
  style?: React.CSSProperties;

  items: SchemaSettingsItemType[];
}

class SchemaSettings<T = {}>{
    constructor(options: SchemaSettingsOptions<T>): SchemaSettings<T>;
    add(name: string, item: Omit<SchemaSettingsItemType, 'name'>): void
    get(nestedName: string): SchemaSettingsItemType | undefined
    remove(nestedName: string): void
}
```

### Details

![](../static/VfPGbhWo9os0qTxcITkcHNfin4g.png)

- name: Unique identifier, required
- Component related
  - Component: Trigger component, default is `<MenuOutlined />` component
  - componentProps: Component properties
  - style: Component style
- items: List item configuration

### Example

#### 基础用法

```tsx | pure
const mySchemaSettings = new SchemaSettings({
  name: 'MySchemaSettings',
  items: [
    {
      name: 'demo1',
      type: 'item',
      componentProps: {
        title: 'DEMO1',
        onClick() {
          alert('DEMO1');
        },
      },
    },
    {
      name: 'demo2',
      Component: () => <SchemaSettings.Item title="DEMO2" onClick={() => alert('DEMO2')} />,
    },
  ],
});
```

#### Custom `Component`

```tsx | pure
const mySchemaSettings = new SchemaSettings({
  name: 'MySchemaSettings',
  Component: Button,
  componentProps: {
    type: 'primary',
    children: '自定义按钮',
  },
  // Component: (props) => <Button type='primary' {...props}>自定义按钮</Button>,
  items: [
    {
      name: 'demo1',
      type: 'item',
      componentProps: {
        title: 'DEMO',
      },
    },
  ],
});
```

## options.items

```tsx | pure
interface SchemaSettingsItemCommon<T = {}> {
  name: string;
  sort?: number;
  type?: string;
  Component: string | ComponentType<T>;
  useVisible?: () => boolean;
  children?: SchemaSettingsItemType[];
  useChildren?: () => SchemaSettingsItemType[];
  checkChildrenLength?: boolean;
  componentProps?: Omit<T, 'children'>;
  useComponentProps?: () => Omit<T, 'children'>;
}
```

### `Component` 和 `type`


- `Component`

```tsx | pure

const Demo = () => {
  return <SchemaSettingsItem title='Demo' />
}

const mySettings = new SchemaSettings({
  name: 'mySettings',
  items: [
    {
      name: 'a',
      Component: Demo,
    }
  ],
});
```

- `type`

NocoBase has built-in some common `type`, such as `type: 'item'`, which is equivalent to `Component: SchemaSettingsItem`.

For more built-in types, please refer to: [Built-in Components and Types](/core/ui-schema/schema-settings#built-in-components-and-types)

```tsx | pure
const mySettings = new SchemaSettings({
  name: 'mySettings',
  items: [
    {
      name: 'a',
      type: 'item',
      componentProps: {
        title: 'Demo',
      },
    }
  ],
});
```

<code src="./demos/schema-settings-options-item-define.tsx"></code>

### `children` and dynamic `useChildren`

For some components that have child items, such as `type: 'itemGroup'`, we use the `children` property. In certain scenarios where the children are dynamic and need to be obtained from hooks, we can define them using `useChildren`.

<code src="./demos/schema-settings-options-item-children.tsx"></code>

### Dynamic visibility with `useVisible`

<code src="./demos/schema-settings-options-item-visible.tsx"></code>

### Component properties `componentProps` and dynamic properties `useComponentProps`

For some common components, we can define component properties using `componentProps`. In certain scenarios where the component properties are dynamic and need to be obtained from hooks, we can define them using `useComponentProps`.

Alternatively, we can encapsulate the properties into a component and define them using `Component`.

<code src="./demos/schema-settings-options-item-props.tsx"></code>

## Methods

```tsx | pure
const mySchemaSettings = new SchemaSettings({
  name: 'MySchemaSettings',
  items: [
    {
      name: 'a',
      type: 'itemGroup',
      componentProps: {
        title: 'item a'
      },
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

### schemaSettings.add()

Use for adding an item.

- Type

```tsx | pure
class SchemaSettings {
    add(name: string, item: Omit<SchemaSettingsItemType, 'name'>): void
}
```

- params

The first parameter is `name`, which is used as a unique identifier for adding, deleting, modifying, and querying, and `name` supports `.` to separate levels.

- Example

```tsx | pure
mySchemaSetting.add('b', {
    type: 'item',
    title: 'item b',
})

mySchemaSetting.add('a.a2', {
    type: 'item',
    title: 'item a2',
})
```

### schemaSettings.get()

- Type

```tsx | pure
class SchemaSettings {
    get(nestedName: string): SchemaSettingsItemType| undefined
}
```

- Example

```tsx | pure
const itemA = mySchemaSetting.get('a')

const itemA1 = mySchemaSetting.add('a.a1')
```

### schemaSettings.remove()

- Type

```tsx | pure
class SchemaSettings {
    remove(nestedName: string): void
}
```

- Example

```tsx | pure
mySchemaSetting.remove('a.a1')

mySchemaSetting.remove('a')
```

## Hooks

### useSchemaSettingsRender()

Use to render SchemaSettings.

- Type

```tsx | pure
function useSchemaSettingsRender(name: string, options?: SchemaSettingsOptions): {
    exists: boolean;
    render: (options?: SchemaSettingsRenderOptions) => React.ReactElement;
}
```

- Example

```tsx | pure
const Demo = () => {
    const filedSchema = useFieldSchema();
    const { render, exists } = useSchemaSettingsRender(fieldSchema['x-settings'], fieldSchema['x-settings-props'])
    return <div>
        <div>{ render() }</div>
        <div>可以进行参数的二次覆盖：{ render({ style: { color: 'red' } }) }</div>
    </div>
}
```

<code src="./demos/schema-settings-render.tsx"></code>

### useSchemaSettings()

Get the schemaSetting context data.

The context data includes the `options` passed when instantiating the `schemaSetting` and the `options` passed when calling `useSchemaSettingsRender()`.

- Type

```tsx | pure
interface UseSchemaSettingsResult<T> extends SchemaSettingsOptions<T> {
  dn?: Designable;
  field?: GeneralField;
  fieldSchema?: Schema;
}

function useSchemaSettings(): UseSchemaSettingsResult;
```

- Example

```tsx | pure
const { dn } = useSchemaSettings();
```

### useSchemaSettingsItem()

Used to retrieve data for an item.

- Type

```tsx | pure
export type SchemaSettingsItemType<T = {}> = {
  name: string;
  type?: string;
  sort?: number;
  Component?: string | ComponentType<T>;
  componentProps?: T;
  useComponentProps?: () => T;
  useVisible?: () => boolean;
  children?: SchemaSettingsItemType[];
  [index]: any;
};

function useSchemaSettingsItem(): SchemaSettingsItemType;
```

- Example

```tsx | pure
const { name } = useSchemaSettingsItem();
```

## Built-in Components and Types

| type        | Component                      |                                     |
| ----------- | ------------------------------ | ----------------------------------------- |
| item        | SchemaSettingsItem            | Text                                      |
| itemGroup   | SchemaSettingsItemGroup       | Group, same as `type: 'itemGroup'` in Menu |
| subMenu     | SchemaSettingsSubMenu         | Submenu, same as submenu in Menu          |
| divider     | SchemaSettingsDivider         | Divider, same as `type: 'divider'` in Menu |
| remove      | SchemaSettingsRemove          | Remove, used to delete a block            |
| select      | SchemaSettingsSelectItem      | Dropdown select                           |
| cascader    | SchemaSettingsCascaderItem    | Cascading select                          |
| switch      | SchemaSettingsSwitchItem      | Switch                                    |
| popup       | SchemaSettingsPopupItem       | Popup                                     |
| actionModal | SchemaSettingsActionModalItem | Action modal                              |
| modal       | SchemaSettingsModalItem       | Modal                                     |

### SchemaSettingsItem

```tsx | pure
interface SchemaSettingsItemProps extends Omit<MenuItemProps, 'title'> {
  title: string;
}
```

The core parameters are `title` and `onClick`, and you can modify the schema in `onClick`.

<code src="./demos/schema-settings-components-item.tsx"></code>

### SchemaSettingsItemGroup

The core parameter is `title`.

<code src="./demos/schema-settings-components-group.tsx"></code>

### SchemaSettingsSubMenu

The core parameter is `title`.

<code src="./demos/schema-settings-components-sub-menu.tsx"></code>

### SchemaSettingsDivider

<code src="./demos/schema-settings-components-divider.tsx"></code>

### SchemaSettingsRemove

```tsx | pure
interface SchemaSettingsRemoveProps {
  confirm?: ModalFuncProps;
  removeParentsIfNoChildren?: boolean;
  breakRemoveOn?: ISchema | ((s: ISchema) => boolean);
}
```

- `confirm`: Confirmation modal before deletion
- `removeParentsIfNoChildren`: Whether to delete the parent node if there are no children after deletion
- `breakRemoveOn`: Whether to interrupt deletion if the deleted node meets certain conditions

<code src="./demos/schema-settings-components-remove.tsx"></code>

### SchemaSettingsSelectItem

<code src="./demos/schema-settings-components-select.tsx"></code>

### SchemaSettingsCascaderItem

### SchemaSettingsSwitchItem

<code src="./demos/schema-settings-components-switch.tsx"></code>

### SchemaSettingsModalItem

```tsx | pure
export interface SchemaSettingsModalItemProps {
  title: string;
  onSubmit: (values: any) => void;
  initialValues?: any;
  schema?: ISchema | (() => ISchema);
  modalTip?: string;
  components?: any;
  hidden?: boolean;
  scope?: any;
  effects?: any;
  width?: string | number;
  children?: ReactNode;
  asyncGetInitialValues?: () => Promise<any>;
  eventKey?: string;
  hide?: boolean;
}
```

We can define the form of the modal using the `schema` parameter, and then retrieve the form values in the `onSubmit` function to modify the current schema node.

<code src="./demos/schema-settings-components-modal.tsx"></code>

### SchemaSettingsActionModalItem

The difference between `SchemaSettingsActionModalItem` and `SchemaSettingsModalItem` is that the `SchemaSettingsModalItem` modal will lose context, while the `SchemaSettingsActionModalItem` will retain context. In simple scenarios, you can use `SchemaSettingsModalItem`, and in complex scenarios, you can use `SchemaSettingsActionModalItem`.

```tsx | pure
export interface SchemaSettingsActionModalItemProps extends SchemaSettingsModalItemProps, Omit<SchemaSettingsItemProps, 'onSubmit' | 'onClick'> {
  uid?: string;
  initialSchema?: ISchema;
  schema?: ISchema;
  beforeOpen?: () => void;
  maskClosable?: boolean;
}
```

<code src="./demos/schema-settings-components-action-modal.tsx"></code>
