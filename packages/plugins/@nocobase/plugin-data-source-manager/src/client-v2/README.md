# v2 Data Source Manager 扩展说明

本文档说明 `plugin-data-source-manager/src/client-v2` 当前提供的扩展点，主要面向需要扩展外部数据源、字段 Interface、数据表模板的插件开发者。

v2 Data Source Manager 的实现原则是：

- 管理页使用 client-v2 / Ant Design 组件实现，不再依赖 v1 SchemaComponent / Formily 页面搭建方式。
- 页面跳转和抽屉统一使用 v2 的 `ctx.viewer` / `ctx.router`。
- 字段 Interface 和数据表模板由各自插件注册，Data Source Manager 只负责读取注册信息并渲染通用管理界面。
- v1 兼容入口仍存在，但新增 v2 扩展应优先使用本文档中的 v2 注册结构。

## 关键入口

- 插件入口：`plugin.tsx`
- 外部数据源表单：`components/DataSourceForm.tsx`
- 数据源列表页：`pages/DataSourcesPage.tsx`
- 数据表列表和创建/编辑：`pages/components/CollectionsPage.tsx`
- 字段列表和创建/编辑：`pages/components/FieldsPage.tsx`、`pages/components/FieldForm.tsx`
- 字段 Interface 配置类型：`field-interfaces/index.ts`
- 数据表模板字段归一化：`packages/core/client-v2/src/collection-manager/template-fields.ts`
- 字段配置项通用工具：`packages/core/client-v2/src/collection-manager/field-configure.ts`

## 1. 扩展外部数据源

外部数据源类型由数据源插件在 client-v2 中注册：

```tsx
import React from 'react';
import { Form, Input, Select } from 'antd';
import { Plugin } from '@nocobase/client-v2';
import PluginDataSourceManagerClientV2 from '@nocobase/plugin-data-source-manager/client-v2';

function MyDataSourceSettingsForm(props) {
  return (
    <>
      <Form.Item name={['options', 'host']} label="Host" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name={['options', 'database']} label="Database" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="collections" label="Collections">
        <Select
          mode="multiple"
          options={[]}
          onFocus={async () => {
            const tables = await props.loadCollections(props.initialValues?.key);
            // 根据插件需要把 tables 转成 Select options 或自定义表格数据。
          }}
        />
      </Form.Item>
    </>
  );
}

export class PluginMyDataSourceClientV2 extends Plugin {
  async load() {
    const dataSourceManagerPlugin = this.app.pm.get(PluginDataSourceManagerClientV2);

    dataSourceManagerPlugin.registerType('myDataSource', {
      label: '{{t("My data source", { ns: "my-data-source" })}}',
      defaultValues: {
        type: 'myDataSource',
        enabled: true,
        options: {},
      },
      SettingsForm: MyDataSourceSettingsForm,
      disableTestConnection: false,
      disableAddFields: false,
    });
  }
}
```

`registerType(name, options)` 的常用字段：

- `name`：数据源类型名，通常由第一个参数传入。
- `label`：在 “Add new” 下拉和 Type 列显示的文案，支持 `{{t(...)}}`。
- `defaultValues`：创建数据源时写入表单的默认值。
- `SettingsForm`：当前数据源类型自己的配置表单，使用原生 Ant Design `Form.Item`。字段值会和基础字段一起提交给 `dataSources:create/update`。
- `disableTestConnection`：隐藏 “Test Connection” 按钮。
- `disableAddFields`：给后续管理逻辑识别是否允许添加字段。
- `disableConfigureFields`：统一禁用 `Configure fields` 中的字段变更动作。启用后只展示字段列表，隐藏新增、编辑、删除，禁止快速修改字段显示名、切换 Interface 和修改 title field。
- `createFieldInterfaces`：限制该数据源在 “Add field” 中可创建的字段 Interface，避免外部数据源暴露不支持的字段类型。
- `normalizeValues`：提交、连接测试前统一整理表单值，适合处理端口数字化、SSL 结构兼容、空值清理等数据源特有逻辑。
- `isFieldInterfaceReadOnly`：可选扩展点，用于让数据源控制某个字段的 `Field interface` 是否只读。没有特殊规则时不需要实现。

`SettingsForm` 接收的 props：

- `mode`：`create` 或 `edit`。
- `type`：当前注册的 `DataSourceTypeOptions`。
- `initialValues`：编辑时的初始数据，创建时包含 `defaultValues`、`type`、自动生成的 `key`。
- `loadCollections(key)`：调用 `dataSources:readTables` 读取外部库表，通常用于选择需要纳入管理的数据表。

### 数据源表单约定

`DataSourceForm` 统一负责基础字段、提交、连接测试、错误提示和抽屉关闭。数据源插件的 `SettingsForm` 只负责渲染本类型的配置项，不需要自己调用 `dataSources:create/update`。

提交和连接测试前会先执行通用归一化：

- `options.port` 如果是纯数字字符串，会转成数字。
- `options.ssl.sslMode === 'disable'` 时，只保留 `{ sslMode: 'disable' }`，和 v1 参数结构保持一致。
- `collections` 支持字符串数组，也支持 `{ name, selected }` 数组；提交前会过滤未选中的项并转换成表名数组。
- 最后执行当前数据源类型的 `normalizeValues(values)`。

连接测试失败、接口返回 `errors/messages/error/message` 时，会统一用 `notification.error` 弹出；提交成功后会调用 `onSubmitted()` 并关闭抽屉。

如果配置项需要支持 “Variables and secrets”，优先使用 client-v2 提供的 `EnvVariableInput`，保持和 v1 外部数据源表单一致的变量输入体验：

```tsx
import { EnvVariableInput } from '@nocobase/client-v2';

<Form.Item name={['options', 'password']} label={t('Password')} rules={[{ required: true }]}>
  <EnvVariableInput password />
</Form.Item>;
```

### 限制外部数据源可创建字段

外部数据源通常不应该直接暴露主数据源的全部字段类型。可以在注册数据源类型时通过 `createFieldInterfaces` 控制 “Add field” 下拉中可选的 Interface：

```tsx
dataSourceManagerPlugin.registerType('external-postgres', {
  createFieldInterfaces: {
    groups: ['basic', 'choices', 'datetime', 'media'],
    exclude: ['password', 'sequence', 'chinaRegion'],
  },
});
```

也可以根据 collection 动态返回：

```tsx
dataSourceManagerPlugin.registerType('external-postgres', {
  createFieldInterfaces({ collection }) {
    if (collection.view) {
      return { include: ['m2o'] };
    }
    return {
      groups: ['basic', 'choices', 'datetime', 'media'],
    };
  },
});
```

`createFieldInterfaces` 只影响创建字段入口；已有字段列表中的 Interface 识别和编辑仍会走字段 Interface 注册信息、模板限制和字段本身的类型兼容规则。

### 只读展示 Configure fields

如果某个外部数据源的表和字段完全由远端 schema 同步，不允许用户在 NocoBase 中变更字段配置，可以使用 `disableConfigureFields`：

```tsx
dataSourceManagerPlugin.registerType('external-postgres', {
  disableConfigureFields: true,
});
```

启用后，`Configure fields` 只保留字段展示和同步入口：

- 隐藏 `Add field` 和批量 `Delete`。
- 隐藏每行 `Edit` / `Delete` 操作。
- `Field display name` 以文本展示，不触发快速编辑保存。
- `Field interface` 以标签展示，不允许切换。
- `Title field` 只读展示，不允许切换。
- 不显示表格行选择框。

如果只想限制新增字段，但仍允许编辑已有字段，继续使用 `disableAddFields`。

### 字段 Interface 只读规则

`Configure fields` 中的 `Field interface` 列默认会对以下字段只读显示：

- `record.source` 存在的字段，通常来自同步或视图字段。
- 字段 Interface 注册信息标记了 `isAssociation` 的关系字段。
- 字段 Interface 属于 `systemInfo` 分组的系统信息字段。
- 通过 `registerCollectionPresetField()` 注册的预置字段，例如 ID、创建时间、创建人、更新时间、更新人等。

如果某个数据源有额外规则，可以实现 `isFieldInterfaceReadOnly()`：

```tsx
dataSourceManagerPlugin.registerType('external-postgres', {
  isFieldInterfaceReadOnly({ field }) {
    if (field.fromExternalSchema) {
      return true;
    }
    return undefined;
  },
});
```

返回值语义：

- `true`：强制只读，只显示标签。
- `false`：强制可编辑，跳过默认只读规则。
- `undefined`：不干预，继续走默认规则。

这个扩展点只用于数据源确实有额外只读策略的场景；普通外部数据源通常只需要配置 `createFieldInterfaces`。

客户端注册只负责管理页 UI 和运行时同步。完整外部数据源还需要服务端提供对应的 data source 类型、连接测试、读取表、加载 collections 等能力。

运行时同步逻辑在 `runtime.ts`：

- `dataSources:listEnabled` 返回的数据会同步到 `ctx.dataSourceManager`。
- `main` 数据源保留已有实现。
- 外部数据源默认使用 flow-engine 的 `DataSource` 类，并把接口返回的 `collections` 写入运行时。

## 2. 注册字段 Interface

字段 Interface 由字段插件注册到 client-v2 的 `dataSourceManager.collectionFieldInterfaceManager`。常规做法是定义一个继承 `CollectionFieldInterface` 的类，并在插件 `load()` 中调用 `this.app.addFieldInterfaces()`。

```tsx
import { CollectionFieldInterface, Plugin } from '@nocobase/client-v2';

export class RatingFieldInterface extends CollectionFieldInterface {
  name = 'rating';
  group = 'basic';
  order = 50;
  title = '{{t("Rating", { ns: "plugin-field-rating" })}}';
  sortable = true;
  availableTypes = ['integer'];
  hasDefaultValue = true;
  titleUsable = true;
  filterable = {
    operators: 'number',
  };

  default = {
    interface: 'rating',
    type: 'integer',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 5,
      },
    },
  };

  configure = {
    items: [
      {
        name: 'uiSchema.x-component-props.max',
        title: '{{t("Max rating", { ns: "plugin-field-rating" })}}',
        component: 'InputNumber',
        defaultValue: 5,
        required: true,
      },
      {
        name: 'defaultValue',
        title: '{{t("Default value")}}',
        component: 'InputNumber',
        hidden: ({ values }) => values.primaryKey || values.unique,
      },
    ],
    normalizeValues(values) {
      return {
        ...values,
        type: 'integer',
      };
    },
  };
}

export class PluginFieldRatingClientV2 extends Plugin {
  async load() {
    this.app.addFieldInterfaces([RatingFieldInterface]);
  }
}
```

字段 Interface 常用字段：

- `name`：字段 Interface 唯一标识，保存到字段的 `interface`。
- `group` / `order`：添加字段时的分组和排序。
- `title` / `description`：添加字段界面显示文案，支持 `{{t(...)}}`。
- `default`：创建字段时的基础提交值，通常包含 `interface`、`type`、`uiSchema`。
- `availableTypes`：SQL / View 等场景下按存储类型筛选可选 Interface。
- `supportDataSourceType` / `notSupportDataSourceType`：按数据源类型控制是否显示。
- `hasDefaultValue`：表示该 Interface 支持默认值配置。
- `filterable`：筛选操作符配置，例如 `{ operators: 'number' }`、`{ operators: 'string' }`。
- `titleUsable`：是否可作为 title field。
- `isAssociation`：关系字段标识，创建时会自动补 `source`。

### configure.items

v2 新增字段配置应优先使用 `configure.items`，不要新增 v1 Formily schema 配置。`FieldForm` 会读取 `getFieldInterfaceConfigure()` 的结果并渲染这些配置项。

`configure.items` 中每一项常用字段：

- `name`：表单字段路径，支持点路径，如 `uiSchema.x-component-props.max`。
- `title` / `description`：表单项文案。
- `component`：内置控件名，如 `Input`、`Input.TextArea`、`InputNumber`、`Checkbox`、`Select`、`Radio.Group`、`DatePicker`、`ColorPicker`、`ArrayTable`、`FieldValidation`、`CollectionSelect` 等。
- `Component`：自定义 React 组件。复杂交互建议放在字段插件内部实现，然后通过这里注册。
- `componentProps`：传给控件的属性。
- `options`：`Select`、`Radio.Group` 等控件选项。
- `defaultValue`：创建字段时的默认配置值。
- `required`：是否必填。
- `hidden` / `disabled`：布尔值、表达式字符串，或函数。函数会收到当前表单值和运行时上下文。
- `effect`：配置项联动逻辑。
- `schema`：保留给兼容和特殊数据源场景，例如 `schema.enum = '{{collections}}'` 会触发加载 collections。
- `layout`：用于配置项横向布局。

复杂组件示例可以参考：

- Sequence：`plugin-field-sequence/src/client-v2/interface.tsx`
- Formula：`plugin-field-formula/src/client-v2/interfaces/formula.tsx`
- Markdown Vditor：`plugin-field-markdown-vditor/src/client-v2/interface.tsx`

### 追加或覆盖已有 Interface 配置

如果插件不拥有字段 Interface 类本身，但需要给某个 Interface 追加 v2 配置，可以通过 Data Source Manager 插件注册：

```tsx
const dataSourceManagerPlugin = this.app.pm.get(PluginDataSourceManagerClientV2);

dataSourceManagerPlugin.registerFieldInterfaceConfigure({
  name: 'input',
  items: [
    {
      name: 'uiSchema.x-component-props.placeholder',
      title: '{{t("Placeholder")}}',
      component: 'Input',
    },
  ],
});
```

如果目标 Interface 尚未注册，配置会先暂存，等 Interface 注册后自动合并。合并规则是同名 `items.name` 后注册覆盖先注册。

### 字段值提交流程

字段创建/编辑时，`FieldForm` 的处理顺序大致是：

1. 读取 Interface 的 `default` 和 `configure.items` 生成初始值。
2. 应用 `items.defaultValue`。
3. 执行 core 通用联动，例如 primary/unique/defaultValue/date format。
4. 提交前执行 `configure.validate()`。
5. 执行 `configure.normalizeValues()` 或 `configure.normalize()`。
6. 执行字段 Interface 的 `initialize()` 和 `configure.initialize()`。
7. 调用字段接口：
   - 主数据源：`collections/{collection}/fields:create/update`
   - 外部数据源：`dataSourcesCollections/{dataSourceKey}.{collection}/fields:create/update`

## 3. 注册数据表模板

数据表模板由 Data Source Manager 插件维护。插件可以调用 `registerCollectionTemplate()` 注册自己的模板。

```tsx
const dataSourceManagerPlugin = this.app.pm.get(PluginDataSourceManagerClientV2);

dataSourceManagerPlugin.registerCollectionTemplate({
  name: 'calendar',
  title: '{{t("Calendar collection", { ns: "calendar" })}}',
  description: '{{t("Store calendar events", { ns: "calendar" })}}',
  order: 20,
  color: 'orange',
  collection: {
    options: {
      template: 'calendar',
      createdBy: true,
      updatedBy: true,
      createdAt: true,
      updatedAt: true,
      sortable: true,
    },
    fields: [
      {
        name: 'cron',
        interface: 'select',
        type: 'string',
        title: '{{t("Repeats", { ns: "calendar" })}}',
        component: 'Select',
        componentProps: {
          allowClear: true,
        },
        options: [
          { label: '{{t("Daily", { ns: "calendar" })}}', value: '0 0 0 * * ?' },
          { label: '{{t("Weekly", { ns: "calendar" })}}', value: 'every_week' },
          { label: '{{t("Monthly", { ns: "calendar" })}}', value: 'every_month' },
          { label: '{{t("Yearly", { ns: "calendar" })}}', value: 'every_year' },
        ],
      },
      {
        name: 'exclude',
        interface: 'json',
        type: 'json',
      },
    ],
  },
  fieldInterfaces: {
    create: {
      exclude: ['tableoid'],
    },
  },
  presetFields: {
    disabledIncludes: ['id'],
  },
});
```

模板常用字段：

- `name`：模板唯一标识，会写入 collection 的 `template`。
- `title` / `description`：创建数据表时显示的说明。
- `order` / `divider`：模板列表排序和分隔线。
- `color`：保留字段，当前 v2 创建界面不强调展示颜色。
- `collection.options`：创建数据表时合并到提交值里的 collection 选项。
- `collection.fields`：模板默认创建的字段。
- `capabilities.recordUniqueKey`：显示 “Record unique key” 配置。
- `capabilities.simplePaginate`：模板支持 simple paginate。
- `fieldInterfaces`：控制该模板下字段 Interface 可见范围。
- `presetFields`：控制通用预设字段是否可选。
- `configure.items`：模板自己的创建/编辑配置项。
- `configure.Form`：模板自己的完整表单片段。
- `configure.transformSubmitValues`：提交前转换数据。

### collection.fields 的写法

模板字段可以写成更语义化的结构，Data Source Manager 会在提交前转换成接口需要的字段格式。

```ts
{
  name: 'status',
  interface: 'select',
  type: 'string',
  title: '{{t("Status")}}',
  component: 'Select',
  componentProps: {
    allowClear: true,
  },
  options: [
    { label: '{{t("Open")}}', value: 'open' },
    { label: '{{t("Closed")}}', value: 'closed' },
  ],
}
```

转换规则：

- `title` -> `uiSchema.title`
- `options` -> `uiSchema.enum`
- `component` -> `uiSchema['x-component']`
- `componentProps` -> `uiSchema['x-component-props']`
- 如果字段有 `interface`，会先合并该 Interface 的 `default`，再合并模板字段自身配置。

因此模板作者只需要写模板特有字段，通用预设字段如 `id`、`createdAt`、`createdBy`、`updatedAt`、`updatedBy` 由预设字段机制统一处理，不需要在每个模板里重复写。

### configure.items 示例

SQL / View 这类模板可以在所属插件里使用 `configure.items` 提供复杂配置：

```tsx
dataSourceManagerPlugin.registerCollectionTemplate({
  name: 'sql',
  title: '{{t("SQL collection")}}',
  order: 40,
  collection: {
    options: {
      template: 'sql',
    },
    fields: [],
  },
  capabilities: {
    recordUniqueKey: true,
  },
  configure: {
    items: [
      {
        name: 'sql',
        Component: SqlStatementConfigureItem,
        required: true,
      },
      {
        name: 'sources',
        Component: SqlSourceCollectionsConfigureItem,
      },
      {
        name: 'fields',
        Component: SqlFieldsConfigureItem,
        required: true,
      },
      {
        name: 'preview',
        Component: SqlPreviewConfigureItem,
      },
    ],
    syncFields: {
      visible: true,
      Component: SqlSyncFieldsDrawer,
    },
    transformSubmitValues: normalizeSqlCollectionSubmitValues,
  },
});
```

`configure.items` 会同时用于创建和编辑。可以通过 `hidden: ({ mode }) => mode === 'edit'` 控制不同状态下的显示。
`configure.syncFields` 用于扩展 Configure fields 抽屉里的 `Sync from database` 行为，适合 SQL collection 这类需要自定义同步字段交互的模板。

### fieldInterfaces 限制

模板可以限制字段列表和添加字段时可用的 Interface：

```ts
fieldInterfaces: {
  include: ['input', 'integer', 'datetime'],
  exclude: ['tableoid'],
  create: {
    include: ['m2o'],
  },
}
```

- `include` / `exclude` 控制字段列表和字段配置中可见 Interface。
- `create.include` / `create.exclude` 控制添加字段时可选 Interface。
- `systemInfo` 分组字段有特殊处理：例如 `createdAt` 是否显示会参考 collection 上的同名布尔配置；`tableoid` 默认只在 PostgreSQL 下显示，除非模板显式 include。

### 预设字段扩展

通用预设字段通过 `registerCollectionPresetField()` 注册：

```tsx
dataSourceManagerPlugin.registerCollectionPresetField({
  name: 'space',
  order: 600,
  defaultSelected: true,
  description: '{{t("Store record space")}}',
  value: {
    name: 'space',
    interface: 'space',
    type: 'belongsTo',
    target: 'spaces',
    foreignKey: 'spaceName',
    onDelete: 'SET NULL',
    uiSchema: {
      type: 'object',
      title: '{{t("Space", { ns: "@nocobase/plugin-multi-space" })}}',
      'x-component': 'AssociationField',
      'x-component-props': {
        fieldNames: {
          value: 'name',
          label: 'title',
        },
      },
    },
  },
});
```

模板可以通过 `presetFields.disabled` 禁用全部预设字段选择，或通过 `presetFields.disabledIncludes` 禁用部分预设字段。

## 其他扩展点和注意事项

### 管理页 Action 扩展

`extensionManager.registerManagerAction()` 可向数据源管理页补充顶部操作按钮：

```tsx
dataSourceManagerPlugin.extensionManager.registerManagerAction({
  order: 100,
  component: MyManagerAction,
});
```

### 筛选操作符

字段 Interface 的 `filterable` 用于告诉 v2 筛选组件、筛选区块、变量筛选等场景：这个字段是否可筛选，以及应该展示哪些操作符。

推荐写法是引用 core client-v2 中注册的 operator group，而不是在每个字段 Interface 里重复写完整操作符数组：

```ts
filterable = {
  operators: 'number',
};
```

core client-v2 当前常用 operator group：

| group | 适用字段 | 典型操作符 |
| --- | --- | --- |
| `string` | 单行文本、邮箱、手机号、URL、UUID、NanoID、密码等 | contains / does not contain / is / is not / is empty |
| `number` | integer、number、percent、sort、snowflakeId 等 | = / != / > / >= / < / <= / is empty |
| `datetime` | datetime、dateOnly、createdAt、updatedAt、unixTimestamp 等 | is / is before / is after / is between / is empty |
| `enumType` | select、radioGroup 等单选枚举 | is / is not / is any of / is none of |
| `array` | multipleSelect、checkboxGroup 等多值字段 | is / is not / is any of / is none of |
| `boolean` | checkbox 等布尔字段 | Yes / No / is empty |
| `id` | id 字段 | is / is not / exists / not exists |
| `time` | time 字段 | is / is not / is empty |
| `bigField` | markdown、richText、code、attachment-url 等大文本或长内容字段 | contains |
| `collection` | collection selector 字段 | is / is not / is any of / is none of |
| `tableoid` | tableoid 字段 | is any of / is none of |


动态类型字段可以使用 `createTypedFilterable()`。例如 Formula 字段的返回类型可能是 boolean、string、date 或 number，不同类型应该显示不同操作符：

```ts
import { createTypedFilterable } from '@nocobase/client-v2';

filterable = createTypedFilterable(
  [
    { types: ['boolean'], operators: 'boolean' },
    { types: ['string'], operators: 'string' },
    { types: ['date'], operators: 'datetime' },
    { types: ['integer', 'double', 'bigInt', 'number'], operators: 'number' },
  ],
  (meta) => meta?.dataType,
);
```

如果插件需要特殊操作符，应先注册操作符或操作符组，再在字段 Interface 里引用：

```ts
export class PluginFieldFormulaClient extends Plugin {
  async load() {
    this.app.registerFieldFilterOperatorGroup('formulaDate', [
      {
        label: '{{t("is current fiscal year", { ns: "field-formula" })}}',
        value: '$isCurrentFiscalYear',
        noValue: true,
      },
      {
        label: '{{t("is previous fiscal year", { ns: "field-formula" })}}',
        value: '$isPreviousFiscalYear',
        noValue: true,
      },
    ]);

    this.app.addFieldInterfaces([FormulaFieldInterface]);
  }
}

export class FormulaFieldInterface extends CollectionFieldInterface {
  name = 'formula';
  filterable = {
    operators: 'formulaDate',
  };
}
```

也可以先注册单个 operator，再用 operator 名组装 group：

```ts
this.app.registerFieldFilterOperator({
  label: '{{t("matches regex")}}',
  value: '$regex',
  schema: {
    'x-component': 'Input',
  },
});

this.app.registerFieldFilterOperatorGroup('advancedString', ['$regex']);
```

如果这个操作符还会用于联动规则，需要同时注册前端 JSON Logic 操作。操作符注册只决定下拉列表里能不能选到，联动规则的条件判断是在前端通过 `app.jsonLogic.apply()` 执行的：

```ts
this.app.registerFieldFilterOperator({
  label: '{{t("is any of")}}',
  value: '$isAnyOf',
  schema: {
    'x-component': 'Select',
    'x-component-props': {
      mode: 'multiple',
    },
  },
});

this.app.registerFieldFilterOperatorGroup('customSelect', ['$isAnyOf']);

this.app.jsonLogic.addOperation('$isAnyOf', (left, right) => {
  const values = Array.isArray(right) ? right : [right];
  return values.includes(left);
});
```

如果同一个操作符还要用于数据表查询、区块筛选或服务端资源查询，还需要在服务端注册对应的 database operator。

注意事项：

- `filterable` 为空或不设置时，该字段通常不会出现在依赖 filterable 元数据的筛选列表中。
- 如果字段明确不允许筛选，可以设置 `filterable = false`。
- `operator.value` 用于生成筛选条件；如果用于服务端查询，必须有后端查询层能识别的 database operator；如果用于联动规则，必须有前端 `jsonLogic` operation。
- `operator.schema` 用于控制该操作符对应的值输入组件；`noValue: true` 表示该操作符不需要输入值，例如 empty、exists。
- 注册自定义 group 时应尽量使用插件命名空间语义，避免和 core group 重名。

### 与 v1 的边界

- v2 新代码不要 import `@nocobase/client`，应使用 `@nocobase/client-v2`、`@nocobase/flow-engine` 和 Ant Design。
- 新字段配置优先写 `configure.items` / `Component`，不要继续扩展 v1 schema family 的实现。
- `properties`、`getConfigureFormProperties`、`availableFieldInterfaces`、`ConfigureForm`、`beforeSubmit` 等旧入口仍有兼容处理，但新扩展应使用 `configure.items`、`fieldInterfaces`、`configure.Form`、`configure.transformSubmitValues`。
- 复杂配置组件应放在对应字段插件或模板插件内注册，Data Source Manager 只消费注册结果。
