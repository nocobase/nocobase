# SchemaSettings

## new SchemaSettings(options)

创建一个 SchemaSettings 实例。

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

### 详细解释

![](../static/VfPGbhWo9os0qTxcITkcHNfin4g.png)

- name：唯一标识，必填
- Component 相关

  - Component：触发组件，默认是 `<MenuOutlined />` 组件
  - componentProps: 组件属性
  - style：组件的样式
- items：列表项配置

### 示例

#### 基础用法

```tsx | pure
const mySchemaSettings = new SchemaSettings({
  name: 'MySchemaSettings',
  items: [
    {
      name: 'demo1', // 唯一标识
      type: 'item', // 内置类型
      componentProps: {
        title: 'DEMO1',
        onClick() {
          alert('DEMO1');
        },
      },
    },
    {
      name: 'demo2',
      Component: () => <SchemaSettings.Item title="DEMO2" onClick={() => alert('DEMO2')} />, // 直接使用 Component 组件
    },
  ],
});
```

#### 定制化 `Component`

```tsx | pure
const mySchemaSettings = new SchemaSettings({
  name: 'MySchemaSettings',
  Component: Button, // 自定义组件
  componentProps: {
    type: 'primary',
    children: '自定义按钮',
  },
  // Component: (props) => <Button type='primary' {...props}>自定义按钮</Button>, // 等同于上面效果
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

##

实例方法

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

用于新增 Item。

- 类型

```tsx | pure
class SchemaSettings {
    add(name: string, item: Omit<SchemaSettingsItemType, 'name'>): void
}
```

- 参数说明

第一个参数是 name，作为唯一标识，用于增删改查，并且 `name` 支持 `.` 用于分割层级。

- 示例

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

- 类型

```tsx | pure
class SchemaSettings {
    get(nestedName: string): SchemaSettingsItemType| undefined
}
```

- 示例

```tsx | pure
const itemA = mySchemaSetting.get('a')

const itemA1 = mySchemaSetting.add('a.a1')
```

### schemaSettings.remove()

- 类型

```tsx | pure
class SchemaSettings {
    remove(nestedName: string): void
}
```

- 示例

```tsx | pure
mySchemaSetting.remove('a.a1')

mySchemaSetting.remove('a')
```

## Hooks

### useSchemaSettingsRender()

用于渲染 SchemaInitializer。

- 类型

```tsx | pure
function useSchemaSettingsRender(name: string, options?: SchemaSettingsOptions): {
    exists: boolean;
    render: (options?: SchemaSettingsRenderOptions) => React.ReactElement;
}
```

- 示例

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

### useSchemaSettings()

获取 schemaSetting 上下文数据。

上下文数据包含了 `schemaSetting` 实例化时的 `options` 以及调用 `useSchemaSettingsRender()` 时传入的 `options`。

- 类型

```tsx | pure
interface UseSchemaSettingsResult<T> extends SchemaSettingsOptions<T> {
  dn?: Designable;
  field?: GeneralField;
  fieldSchema?: Schema;
}

function useSchemaSettings(): UseSchemaSettingsResult;
```

- 示例

```tsx | pure
const { dn } = useSchemaSettings();
```

### useSchemaSettingsItem()

用于获取一个 item 的数据。

- 类型

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

- 示例

```tsx | pure
const { name } = useSchemaSettingsItem();
```

## 列表项组件

| type        | Component                      | 效果                                      |
| ----------- | ------------------------------ | ----------------------------------------- |
| item        | SchemaSettingsItem            | 文本                                      |
| itemGroup   | SchemaSettingsItemGroup       | 分组，同 Menu 组件的 `type: 'group'`      |
| subMenu     | SchemaSettingsSubMenu         | 子菜单，同 Menu 组件的子菜单              |
| divider     | SchemaSettingsDivider         | 分割线，同 Menu 组件的  `type: 'divider'` |
| remove      | SchemaSettingsRemove          | 删除，用于删除一个区块                    |
| select      | SchemaSettingsSelectItem      | 下拉选择                                  |
| cascader    | SchemaSettingsCascaderItem    | 级联选择                                  |
| switch      | SchemaSettingsSwitchItem      | 开关                                      |
| popup       | SchemaSettingsPopupItem       | 弹出层                                    |
| actionModal | SchemaSettingsActionModalItem | 操作弹窗                                  |
| modal       | SchemaSettingsModalItem       | 弹窗                                      |

### SchemaSettingsItem

文本。

```tsx | pure
const MarkdownEdit = () => {
  const field = useField();
  return <SchemaSettingsItem
    title="Edit markdown"
    onClick={() => {
      field.editable = true;
    }}
  />;
}

const mySchemaSettings = new SchemaSettings({
  name: 'MySchemaSettings',
  items: [
    {
      name: 'a',
      Component: MarkdownEdit,
    },
  ],
});
```

### SchemaSettingsItemGroup

分组。

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

### SchemaSettingsSubMenu

子菜单。

```tsx | pure
const mySchemaSettings = new SchemaSettings({
  name: 'MySchemaSettings',
  items: [
    {
      name: 'a',
      type: 'subMenu',
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

### SchemaSettingsDivider

分割线。

```tsx | pure
const mySchemaSettings = new SchemaSettings({
  name: 'MySchemaSettings',
  items: [
    {
      name: 'divider',
      type: 'divider',
    },
  ],
});
```

### SchemaSettingsRemove

删除。

```tsx | pure
const mySchemaSettings = new SchemaSettings({
  name: 'MySchemaSettings',
  items: [
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true
        breakRemoveOn: {
          'x-component': 'Grid',
        }
      },
    },
  ],
});
```

### SchemaSettingsSelectItem

```tsx | pure
const PatternMode = () => {
  const fieldSchema = useFieldSchema();
  const patternMode = fieldSchema['x-pattern'];
  const { patch } = useDesignable();

  return <SchemaSettingsSelectItem
    key="pattern"
    title={'Pattern'}
    options={[
      { label: 'Editable', value: 'editable' },
      { label: 'Readonly', value: 'readonly' },
      { label: 'Easy-reading', value: 'read-pretty' },
    ]}
    value={patternMode}
    onChange={(v) => {
      patch({
        'x-pattern': v,
      })
    }}
  />
}
```

### SchemaSettingsCascaderItem

级联选择。

### SchemaSettingsSwitchItem

开关。

```tsx | pure
const AllowMultiple = () => {
  const fieldSchema = useFieldSchema();
  const { patch } = useDesignable();
  return <SchemaSettingsSwitchItem
    title={t('Allow multiple')}
    checked={
      fieldSchema['x-component-props']?.multiple === undefined ? true : fieldSchema['x-component-props'].multiple
    }
    onChange={(value) => {
      patch({
        'x-component-props': {
          multiple: value,
        },
      })
    }}
  />
}
```

### SchemaSettingsPopupItem

弹出层。

### SchemaSettingsActionModalItem

操作弹窗。

### SchemaSettingsModalItem

弹窗。

```tsx | pure
const EditTooltip = () => {
  const fieldSchema = useFieldSchema();
  const { patch } = useDesignable();

  return <SchemaSettingsModalItem
    key="edit-tooltip"
    title={t('Edit tooltip')}
    schema={
      {
        type: 'object',
        title: t('Edit tooltip'),
        properties: {
          tooltip: {
            default: fieldSchema?.['x-decorator-props']?.tooltip,
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {},
          },
        },
      } as ISchema
    }
    onSubmit={({ tooltip }) => {
      patch({
        'x-decorator-props': {
          tooltip,
        },
      })
    }}
  />
}
```
