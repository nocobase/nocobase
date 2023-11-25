---
group:
  title: Client
  order: 1
---

# SchemaSettings

## API

### new SchemaSettings(options)

创建一个 Schema 配置实例。

#### 参数类型

```ts | pure
interface SchemaSettingOptions<T = {}>{
  name: string;
  Component?: ComponentType<T>;
  componentProps?: T;
  style?: React.CSSProperties;
  items: SchemaSettingsItemType[];
}
```

#### 参数详细信息

- name

用于标识 Schema 配置的名称。

会用在 schema 中的 `x-settings` 配置值以及读取 schema 的值会传给 [useSchemaSettingRender()](#useschemasettingsrender) 的第一个参数。

```ts | pure
const mySettings = new SchemaSettings({
   //  定义 name
  name: 'MySettings',
})
```

- Component、componentProps & style

Component 默认是一个 Icon，如果需要定制化，可以为一个 React 组件。

```tsx | pure
import { SettingOutlined } from '@ant-design/icons';
const mySettings = new SchemaSettings({
  Component: () => <SettingOutlined style={{ cursor: 'pointer' }} />
})
```

如果你使用的是一个公共的组件，不同的 Settings 有定制化的诉求，那么你可以使用 componentProps 和 style。

```tsx | pure
import { Button } from '@ant-design/icons';
const mySettings = new SchemaSettings({
  Component: Button,
  componentProps: {
    type: 'primary'
  }
})
```

当然也可以这样是使用。

```tsx | pure
const mySettings = new SchemaSettings({
  Component: () => <Button type="primary" />
})
```

- items

items 的类型为 `SchemaSettingsItemType[]`，具体如下：

```ts | pure
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
```

最简单的配置如下：

```ts | pure
const mySettings = new SchemaSettings({
  items: [
    {
      name: 'edit',
      Component: MyComponent,
    },
  ],
})
```

`type` 内置类型：为了更简单的使用，我们提供了一些内置的类型，可以直接使用。

```ts | pure
const mySettings = new SchemaSettings({
  items: [
    {
      name: 'edit',
      type: 'modal', // 弹窗
    },
  ],
})
```

其底层对应的是 `SchemaSettingsModalItem` 组件。具体内置类型和对应的组件如下：

| type | Component | 效果 |
| --- | --- | --- |
| item | SchemaSettingsItem | 文本 |
| itemGroup | SchemaSettingsItemGroup | 分组，同 Menu 组件的 `type: 'group'` |
| subMenu | SchemaSettingsSubMenu | 子菜单，同 Menu 组件的子菜单 |
| divider | SchemaSettingsDivider | 分割线，同 Menu 组件的  `type: 'divider'` |
| remove | SchemaSettingsRemove | 删除，用于删除一个区块 |
| select | SchemaSettingsSelectItem | 下拉选择 |
| cascader | SchemaSettingsCascaderItem | 级联选择 |
| switch | SchemaSettingsSwitchItem | 开关 |
| popup | SchemaSettingsPopupItem | 弹出层 |
| actionModal | SchemaSettingsActionModalItem | 操作弹窗 |
| modal | SchemaSettingsModalItem | 弹窗 |

`componentProps` 和 `useComponentProps`：用于定制化内置组件的 props，两者的区别是后面的可以使用一些 hooks。

```ts | pure
const mySettings = new SchemaSettings({
  items: [
    {
      name: 'allowAddNew',
      type: 'switch',
      useComponentProps() {
        // 可以在这里使用 hooks
        const { t } = useTranslation();
        const field = useField<Field>();
        return {
          title: t('Allow add new data'),
          checked: fieldSchema['x-add-new'] as boolean,
        }
      }
    },
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true
      },
    },
  ],
})
```

`useVisible` 则是控制组件是否显示，可以使用 hooks。

```ts | pure
const mySettings = new SchemaSettings({
  items: [
    {
      name: 'upload',
      type: 'switch',
      useVisible() {
        // 这里使用了 hooks
        const { form } = useFormBlockContext();
        return !!form?.readPretty;
      }
    },
  ],
})
```
### schemaSetting 实例方法

schemaSetting 实例用于对 `items` 进行增删改查。

#### schemaSetting.get()

用于获取一个 item，并且可以通过 `.` 获取子 item。

- 类型

```ts | pure
interface SchemaSettings {
  get(name: string): SchemaSettingsItemType | undefined;
}
```

- 示例

```ts | pure
const mySchemaSettings = new SchemaSettings({
  name: 'MySchemaSettings',
  items: [
    {
      name: 'demo',
      type: 'itemGroup',
      children: [
        {
          name: 'child1',
          type: 'modal',
        },
      ],
    },
  ],
});

// 获取 item
const demo = mySchemaSettings.get('demo');

// 获取子 item
const child1 = mySchemaSettings.get('demo.child1');
```

#### schemaSetting.remove()

用于删除一个 item。

-  类型

```ts | pure
interface SchemaSettings {
  remove(name: string): void;
}
```

- 示例

```ts | pure
mySchemaSettings.remove('demo2');

mySchemaSettings.remove('demo.child2');
```

#### schemaSetting.add()

用于新增一个 item。

-  类型

```ts | pure
interface SchemaSettings {
  add(name: string, item: Omit<SchemaSettingsItemType, 'name'>): void;
}
```

- 示例

```ts | pure
mySchemaSettings.add('demo2', { type: 'switch' });

mySchemaSettings.add('demo.child2', { type: 'actionModel' });
```

### app.schemaSettingsManager 管理器

#### app.schemaSettingsManager.getAll()

获取所有的 schemaSetting 实例。

- 类型

```ts | pure
interface SchemaSettingsManager {
  getAll(): SchemaSettings[];
}
```

- 示例

```ts | pure
import { Plugin } from '@nocobase/plugin'
class MyPlugin extends Plugin {
  load() {
    const allSchemaSettings = this.app.schemaSettingsManager.getAll();
  }
}
```

#### app.schemaSettingsManager.get()

用于获取一个 schemaSetting 实例，

- 类型

```ts | pure
interface SchemaSettingsManager {
  get(name: string): SchemaSettings | undefined;
}
```

- 参数说明

name 为 `new SchemaSettings(options)` 中的 name。

- 示例

```ts | pure
import { Plugin } from '@nocobase/plugin'
class MyPlugin extends Plugin {
  load() {
    const mySchemaSettings = this.app.schemaSettingsManager.get('MySchemaSettings');
  }
}
```

#### app.schemaSettingsManager.remove()

用于删除一个 schemaSetting 实例。

- 类型

```ts | pure
interface SchemaSettingsManager {
  remove(name: string): void;
}
```

- 参数说明

name 为 `new SchemaSettings(options)` 中的 name。

- 示例

```ts | pure
import { Plugin } from '@nocobase/plugin'
class MyPlugin extends Plugin {
  load() {
    this.app.schemaSettingsManager.remove('MySchemaSettings');
  }
}
```

#### app.schemaSettingsManager.add()

新增一个 schemaSetting 实例。

- 类型

```ts | pure
interface SchemaSettingsManager {
  add(schemaSetting: SchemaSettings): void;
}
```

- 示例

```ts | pure
import { Plugin } from '@nocobase/plugin'

const mySchemaSettings = new SchemaSettings({
  name: 'MySchemaSettings',
  items: [],
});

class MyPlugin extends Plugin {
  load() {
    this.app.schemaSettingsManager.add(mySchemaSettings);
  }
}
```

#### app.schemaSettingsManager.has()

判断是否存在一个 schemaSetting 实例。

- 类型

```ts | pure
interface SchemaSettingsManager {
  has(name: string): boolean;
}
```

- 示例

```ts | pure
import { Plugin } from '@nocobase/plugin'

class MyPlugin extends Plugin {
  load() {
    const hasMySchemaSettings = this.app.schemaSettingsManager.has('MySchemaSettings');
  }
}
```


### Hooks

#### useSchemaSettingsRender()

用于渲染 schemaSetting 实例。

- 类型

```tsx | pure
interface SchemaSettingOptions<T = {}>{
  name: string;
  Component?: ComponentType<T>;
  componentProps?: T;
  style?: React.CSSProperties;
  items: SchemaSettingsItemType[];
}

interface SchemaSettingsRenderResult {
  render: (options?: SchemaSettingOptions) => React.ReactElement;
  exists: boolean;
}

function useSchemaSettingsRender(
  name: string,
  options?: SchemaSettingsRenderOptions,
): SchemaSettingsRenderResult;
```

- 示例

```tsx | pure
const MyDesigner = (props) => {
  const { modalTip } = props;

  const { render, exists } = useSchemaSettingsRender(fieldSchema['x-settings'], fieldSchema['x-settings-props']);

  return <div>{render()}</div>
}

```

#### useSchemaSettings()

获取 schemaSetting 上下文数据。

上下文数据包含了 `schemaSetting` 实例化时的 `options` 以及调用 `useSchemaSettingsRender()` 时传入的 `options`。

- 类型

```ts | pure
interface UseSchemaSettingsResult<T> extends SchemaSettingOptions {
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

#### useSchemaSettingsItem()

用于获取一个 item 的数据。

- 类型

```ts
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

```ts
const { name } = useSchemaSettingsItem();
```

### Components

>  TODO: 文档待补充

## Examples

### 基础用法

<code src="./demos/basic.tsx"></code>

### 自定义按钮

<code src="./demos/custom-component.tsx"></code>

### 内置类型

NocoBase 提供了几个内置的组件，可以直接使用。

<code src="./demos/built-type.tsx"></code>

### Schema

<code src="./demos/schema-basic.tsx"></code>

### 动态显示、隐藏

### Designer 上下文

<code src="./demos/demo3.tsx"></code>
