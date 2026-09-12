# client-v2 components

这里收纳 `@nocobase/client-v2` 暴露给业务插件复用的一组 React 组件。组件按目录组织——目前主要是 `form/`，给设置页和表单场景用。

写新插件前先翻一遍这份说明，能省下不少重复造轮子的功夫。组件之间互相耦合很少，按需 import 就行。

## form/

`form/` 目录下的组件围绕「设置页 + 表单」这一类场景。常见用法是配合 `ctx.viewer.drawer` / `ctx.viewer.dialog` 打开一个表单容器，里面放 antd 的 `Form` + `Form.Item`，字段用这里提供的标准控件。

下面按用途分四组：表单容器、表单字段、数据表、工具。

### 表单容器

#### DrawerFormLayout

抽屉形态的表单 layout。配合 `ctx.viewer.drawer({ closable: true, content })` 用。

- 顶部 Header：只放标题；左侧的关闭 X 来自 antd Drawer——必须在 `viewer.drawer` 上显式传 `closable: true` 才会出现
- 底部 Footer：默认 Cancel / Submit 两个按钮；可以用 `footer` 完全替换
- 中间 children：调用方自己放 `<Form>` 实例 + 字段

```tsx
import { DrawerFormLayout } from '@nocobase/client-v2';

ctx.viewer.drawer({
  width: '50%',
  closable: true,  // 关键：开启 antd Drawer 原生关闭 X
  content: () => (
    <DrawerFormLayout
      title={t('添加认证器')}
      onSubmit={handleSubmit}
      submitting={submitting}
    >
      <Form form={form} layout="vertical">
        {/* 字段 */}
      </Form>
    </DrawerFormLayout>
  ),
});
```

主要属性：

- `title`：标题节点
- `onSubmit`：回调，resolve 后会自动关闭抽屉。throw 可以让抽屉保持打开（比如校验失败）
- `submitting`：驱动 Submit 按钮的 loading
- `submitText` / `cancelText`：按钮文字
- `footer`：完全自定义 Footer 内容（覆盖默认两个按钮）

需要在关闭前做「未保存改动」之类的确认，用更底层的 `viewer.drawer({ preventClose, beforeClose })`，这层 layout 不再包装 cancel 拦截。

#### DialogFormLayout

弹窗形态的表单 layout，跟 `DrawerFormLayout` 同形。配合 `ctx.viewer.dialog({ closable: true, content })` 用。

视觉上的差异只有关闭 X 的位置——Drawer 是 antd Drawer 自带的左上角 X，Dialog 是 antd Modal 自带的右上角 X。两边都依赖在 viewer 调用处显式传 `closable: true`，layout 自己都不渲染 close 图标。

```tsx
import { DialogFormLayout } from '@nocobase/client-v2';

ctx.viewer.dialog({
  closable: true,  // 关键：开启 antd Modal 原生右上角 X
  content: () => (
    <DialogFormLayout title={t('绑定验证码')} onSubmit={handleSubmit}>
      <Form form={form} layout="vertical">
        {/* 字段 */}
      </Form>
    </DialogFormLayout>
  ),
});
```

什么时候选哪个？

- **Drawer**：长表单、字段多、需要从一侧滑出占用整面（比如设置页的「添加 / 编辑」）
- **Dialog**：短表单、需要快速确认（比如绑定、修改密码、二次验证）

属性跟 `DrawerFormLayout` 基本一致，可以直接换。唯一区别：`DialogFormLayout` 多一个 `onCancel` 回调（Cancel 按钮和原生 X 都会触发），用于「丢弃改动」之类的确认。

### 表单字段

#### RemoteSelect

异步拉数据的 Select。框架级组件——不感知 NocoBase 业务，调用方传一个 `request` 函数自己拉数据。

```tsx
import { RemoteSelect } from '@nocobase/client-v2';

<Form.Item name="provider" label={t('服务商')}>
  <RemoteSelect<{ name: string; title: string }>
    request={async () => {
      const response = await ctx.api.resource('smsOTPProviders').list();
      return response?.data?.data || [];
    }}
    cacheKey="@nocobase/plugin-verification:smsOTPProviders:list"
    mapOptions={(item) => ({ label: compileT(item.title), value: item.name })}
  />
</Form.Item>
```

主要属性：

- `request: () => Promise`：拉数据，必填。可以返回数组，也可以返回带元数据的对象（搭配 `selectItems` 取出数组）
- `selectItems`：从 `request` 返回值中抽出数组的函数。响应体是 `{ items, meta }` 形态时用
- `fieldNames`：默认按 `{ label, value }` 字段映射；不匹配的时候用 `mapOptions` 完全自定义
- `mapOptions: (item, index) => ({ label, value })`：完整覆盖映射逻辑
- `cacheKey` / `refreshDeps` / `ready`：透传给 ahooks `useRequest`，控制缓存和 refresh 时机
- `onLoaded: (items, response) => void`：拉到数据后的回调，能拿到原始响应

剩下的 antd `Select` props（`mode` / `placeholder` / `disabled` / `value` / `onChange` 等）都原样透传。

默认开启 `showSearch` + `allowClear`，搜索是本地模式（按 label 匹配）。要做服务端搜索，把搜索词放进 `refreshDeps`，在 `request` 里读出来发请求。

#### EnvVariableInput

`$env` 命名空间的变量输入器。专门给「密钥 / 凭证」这类字段用——支持环境变量引用，同时给纯字面值加 password mask。

```tsx
import { EnvVariableInput } from '@nocobase/client-v2';

<Form.Item name={['options', 'accessKeySecret']} label={t('Access Key Secret')}>
  <EnvVariableInput password />
</Form.Item>
```

主要属性：

- `password`：开启后，非变量的字面值会用 `Input.Password` 形态遮盖。变量表达式（比如 `{{ $env.X }}`）依然可见可编辑
- `placeholder` / `disabled` / `value` / `onChange`：标准受控字段属性

值的形态是字符串：`'literal'` 或 `'{{ $env.foo.bar }}'`。服务端在使用时再展开成实际值。

#### VariableInput / VariableTextArea

通用变量输入器。可以引用任意 `flowEngine.context` 注册的命名空间（`$env` / `$user` / 业务自定义的 `$resetLink` 等）。

两者差异：

- `VariableInput`：单行，变量渲染成彩色 pill（视觉上是「短标签」）
- `VariableTextArea`：多行，变量保留 `{{ ... }}` 字面——适合邮件模板这种「字面 + 变量」混排的长文本

```tsx
import { VariableInput, VariableTextArea } from '@nocobase/client-v2';

// 邮件主题：单行 pill 形态
<Form.Item name={['options', 'emailSubject']} label={t('主题')}>
  <VariableInput
    namespaces={['$env']}
    extraNodes={[
      { name: '$resetLink', title: t('重置密码链接'), type: 'string', paths: ['$resetLink'] },
    ]}
  />
</Form.Item>

// 邮件正文：多行字面
<Form.Item name={['options', 'emailContentHTML']} label={t('正文')}>
  <VariableTextArea namespaces={['$env']} rows={10} />
</Form.Item>
```

主要属性：

- `namespaces`：限定可选的顶层命名空间。不传就用 `flowEngine.context` 里全部已注册的
- `extraNodes`：在命名空间过滤后追加几条静态变量（用于 `$resetLink` 这类只在当前页面有意义的局部变量）
- `converters`：覆盖默认的 path ↔ string 转换器。`EnvVariableInput` 就是用这个钩子把输出锁定到 `$env`
- `delimiters`：变量在存储字符串里使用的开闭分隔符，默认 `['{{', '}}']`（对应 Handlebars 的 HTML 转义形式）。若字段最终以 HTML 渲染、转义会破坏变量内容（如站内信正文），传 `['{{{', '}}}']` 走 Handlebars 的原样输出形式
- `value` / `onChange` / `placeholder` / `disabled`：标准受控字段属性

底层共用 `VariableHybridInput`（`VariableInput`）和 `TextAreaWithContextSelector`（`VariableTextArea`），用同一套 MetaTree 数据。

#### TypedVariableInput

类型化常量 + 变量混合输入器。移植 v1 `Variable.Input` 的 `useTypedConstant` 形态：右侧斜体 `x` 按钮触发 Cascader 切换 `[空值 | 常量<types> | 变量和密钥<…namespaces>]`，左侧根据当前模式渲染对应编辑器（`Input` / `InputNumber` / `Select(True/False)` / `DatePicker`）或一颗带变量路径的 pill。

用于字段**同时接受**字面量**和**变量引用的场景。最典型的就是 `plugin-notification-email` 的 SMTP `port` 和 `secure`：可以填具体数字 / 布尔值，也可以填 `{{ $env.SMTP_PORT }}` 走环境变量。

```tsx
import { TypedVariableInput } from '@nocobase/client-v2';

// 端口：数字常量 + $env 变量
<Form.Item name={['options', 'port']} label={t('端口')} initialValue={465}>
  <TypedVariableInput
    types={[['number', { min: 1, max: 65535, step: 1 }]]}
    namespaces={['$env']}
  />
</Form.Item>

// 安全模式：布尔常量 + $env 变量
<Form.Item name={['options', 'secure']} label={t('安全模式')} initialValue={true}>
  <TypedVariableInput types={['boolean']} namespaces={['$env']} />
</Form.Item>

// 注入自定义变量树（如工作流节点的上游输出，不在全局注册表里）
<TypedVariableInput types={['string', 'number']} metaTree={workflowMetaTree} />
```

主要属性：

- `types`：允许的常量类型。形态对齐 v1 `useTypedConstant`，可以传裸类型名 `['number', 'boolean']`，也可以传 `[type, editorProps]` 元组 `[['number', { min, max, step }]]` 把 props 透传给底层 antd 编辑器。默认 `['string', 'number', 'boolean', 'date']`。**即使只允许一种类型，「常量」入口也会展开二级菜单**（数字 / 逻辑值 / 日期 / 字符串）——跟 v1 一致，让用户能直观看到当前常量是什么类型
- `namespaces`：限定变量 picker 可选的顶层命名空间（如 `['$env']`）。不传就用 `flowEngine.context` 里所有已注册命名空间
- `extraNodes`：在命名空间过滤后追加几条静态变量节点
- `metaTree`：**直接注入变量树**，取代读取全局 `flowEngine.context` 的 MetaTree。传了它就**忽略** `namespaces`/`extraNodes`，原样使用这棵树——用于不在全局注册表里的、上下文相关的变量源（典型如工作流节点的上游节点输出 `$jobsMapByNodeKey`）。树里 `children` 为函数（`() => Promise<MetaTreeNode[]>`）的节点会在用户展开 Cascader 时**按需懒加载**（复用 flow-engine 的 `loadMetaTreeChildren`）
- `nullable`：是否暴露「空值」入口，默认 `true`。配合 `Form.Item.rules={[{ required: true }]}` 可以让用户能手动清空、但提交时会被校验拦截——跟 v1 的「空值 + required」组合一致
- `delimiters`：变量 token 开闭分隔符，默认 `['{{', '}}']`，跟 `VariableInput` 一致
- `value` / `onChange` / `placeholder` / `disabled` / `style` / `className`：标准受控字段属性

值的形态：

- 常量：原生类型直接存（`number` / `boolean` / `Date` / `string`）
- 变量：字符串 `'{{ $env.SMTP_PORT }}'`
- 空值：`null`

什么时候**不该用**：

- **纯字面量字段**（用户不会想填变量）→ 直接用 antd `InputNumber` / `Select` / `DatePicker` / `Input`，省掉 Cascader 那一格的视觉开销
- **纯变量字段**（用户不会想填字面量）→ 用 `EnvVariableInput`（`$env` 专用，带 password mask）或 `VariableInput`（更通用）

支持的常量类型：`string` / `number` / `boolean` / `date` / `object`。其中 `object`（即 JSON）渲染为一个等宽字体的内联 textarea（默认两行、可拖拽拉伸），编辑时保留原始文本草稿、失焦（blur）时 `JSON.parse` 回写为对象；解析失败则在输入框**下方单独一行**显示原生 `JSON.parse` 的错误信息（如 `Expected property name or '}' in JSON at position …`，对齐 v1）且不回写。对齐 v1 `useTypedConstant` 的 object 形态（默认值 `{}`）。

跳过的能力（v1 有但 v2 还没补）：

- 异步 `loadChildren` 分支——大多数命名空间的 MetaTree 已经由 `useFilteredMetaTree` 提前展平，没遇到刚需

#### FileSizeInput

文件大小输入器。值统一存字节数，UI 上配一个单位选择器（Byte / KB / MB / GB）。

```tsx
import { FileSizeInput } from '@nocobase/client-v2';

<Form.Item name="maxFileSize" label={t('单文件大小上限')}>
  <FileSizeInput min={1} max={1024 * 1024 * 1024} defaultValue={20 * 1024 * 1024} />
</Form.Item>
```

主要属性：

- `min` / `max`：允许的字节数区间，blur 时会自动 clamp 回界内。默认 `min=1`、`max=Infinity`
- `defaultValue`：用来决定初次显示的单位（比如默认 20 MB 就会以 MB 单位起始）
- `value` / `onChange`：受控字段，值类型是 `number`（字节）

#### PasswordInput

antd `Input.Password` 加一个可选的强度提示条，从 v1 的 `Password` 组件移植过来。用于「设置 / 修改密码」类表单——v1 → v2 迁移过来后视觉信号保持一致。

```tsx
import { PasswordInput } from '@nocobase/client-v2';

<Form.Item name="newPassword" label={t('新密码')} rules={[{ required: true }]}>
  <PasswordInput autoComplete="new-password" checkStrength />
</Form.Item>
```

主要属性：

- `checkStrength`：在输入框下方渲染一条强度提示。默认 `false`。强度评分按 `[20, 40, 60, 80, 100]` 分桶，用裁剪的橙色渐变填充在灰色底条上，配色跟 v1 保持一致
- 其他 antd `Input.Password` 属性原样透传：`value` / `onChange` / `disabled` / `placeholder` / `autoComplete` 等

强度条只是 UX 提示，**不是表单校验**。弱密码仍然能提交，除非 server（或单独安装的 password-policy 商业插件）拒绝。真正的密码规则通过 `Form.Item.rules` 或——等开源 ↔ 商业的 extension point 落地之后——项目共享的 password validator hook 接入。

#### JsonTextArea

JSON 输入器。存的值是 JS 对象（不是字符串），编辑时实时解析、blur 时校验。

```tsx
import { JsonTextArea } from '@nocobase/client-v2';

<Form.Item name="customConfig" label={t('自定义配置')}>
  <JsonTextArea rows={6} json5 />
</Form.Item>
```

主要属性：

- `space`：序列化缩进，默认 `2`
- `json5`：开启后用 JSON5 解析（容忍尾逗号、注释、单引号等）。默认关
- `showError`：解析失败时是否在下方显示错误消息。默认 `true`
- 其他 antd `Input.TextArea` 的属性都透传

`value` / `onChange` 的类型是 `unknown`——因为 JSON 可以是任意结构。调用方按业务约束在 `Form.Item.rules` 里加 validator 收紧类型。

### 数据表

#### Table

设置页表格的标准组件，基于 antd `Table` 扩展了两点：

1. **行索引和复选框切换**：默认状态显示「1 / 2 / 3」行号，悬停或选中时切换成 checkbox。两个元素绝对定位在同一格内，不会抢空间。需要 `rowSelection` 才生效
2. **拖拽排序**：传 `isDraggable` 开启，每行左侧出现拖拽手柄；放下时触发 `onSortEnd`。组件不动 `dataSource`，由调用方在回调里跑 `resource.move(...)` 再 `refresh()`

```tsx
import { Table, DEFAULT_PAGE_SIZE } from '@nocobase/client-v2';

<Table<AuthenticatorRecord>
  rowKey="id"
  loading={loading}
  columns={columns}
  dataSource={data?.records || []}
  isDraggable
  onSortEnd={async (from, to) => {
    await resource.move({ sourceId: from.id, targetId: to.id });
    refresh();
  }}
  rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
  pagination={{
    current: page,
    pageSize,
    total: data?.total || 0,
    onChange: (next, nextSize) => { /* ... */ },
  }}
/>
```

主要属性：

- `rowKey`：必填。拖拽和行身份识别都依赖它
- `showIndex`：默认 `true`，关掉就只显示 checkbox
- `isDraggable`：开关拖拽。默认 `false`，关掉就是个加强版 antd Table
- `onSortEnd: (from, to) => void | Promise`：拖拽放下时触发。调用方负责持久化
- `showSortHandle`：默认 `true`，需要时可以隐藏手柄，自己在某列里嵌 `<SortHandle />`
- 其他 antd `Table` props 全部透传

附带导出：

- `DEFAULT_PAGE_SIZE`（值 `50`）：建议的默认分页大小
- `PAGE_SIZE_OPTIONS`：建议的分页选项 `[5, 10, 20, 50, 100, 200]`
- `SortHandle`：从 `@nocobase/client-v2` 导出的独立手柄组件，可以嵌进自定义列

### 筛选

#### CollectionFilter

绑定 Collection 的筛选按钮。点击展开 Popover，里面是多条件筛选表单（字段选择器 + 操作符 + 取值控件）。Submit 收起 Popover 并通过 `onChange` 发出 NocoBase filter 参数；Reset 保持 Popover 打开并发出 `undefined`。

```tsx
import { CollectionFilter, ExtendCollectionsProvider } from '@nocobase/client-v2';
import lockedUsersCollection from '../../collections/locked-users';

function Page() {
  const main = engine.context.dataSourceManager?.getDataSource?.('main');
  const collection = main?.getCollection?.(lockedUsersCollection.name);

  const listRequest = useRequest(
    async (filter) => api.resource('lockedUsers').list({ ...(filter ? { filter } : {}) }),
    { defaultParams: [undefined] },
  );

  return (
    <ExtendCollectionsProvider collections={[lockedUsersCollection]}>
      <CollectionFilter collection={collection} onChange={listRequest.run} t={t} />
      {/* table … */}
    </ExtendCollectionsProvider>
  );
}
```

主要属性：

- `collection`：作为字段来源的 Collection。`undefined` 时按钮 disabled
- `onChange: (filter) => void`：Submit 或 Reset 时触发，参数是编译好的 NocoBase filter（Reset 时为 `undefined`）。常见做法是直接转给 `listRequest.run`
- `t`：翻译函数。建议传 `useT()`（来自插件 `locale.ts`），它会自动展开服务端返回的 `{{t("…")}}` 模板，否则字段标签、操作符标签可能显示成字面模板
- `filterableFieldNames`：白名单，限制顶层可选字段
- `noIgnore`：忽略白名单
- `buttonText`：覆盖按钮文字，默认 `t('Filter')`
- `showCount`：是否在按钮上显示当前条件数 `(N)`，默认 `true`
- `popoverProps` / `buttonProps`：透传给 antd `Popover` / `Button`
- `popoverMinWidth`：Popover 内容最小宽度，默认 `520`

要筛选的 Collection 如果是 `schema-only`（服务端没自动发布到客户端 data source），用 `<ExtendCollectionsProvider>` 包一下当前页面，让 `CollectionFilter` 能解析到。

### 工具

#### createFormRegistry

带命名空间的「条目注册表」工厂。每次调用返回一个独立的 registry 实例，闭包持有自己的 `Map`。

```ts
import { createFormRegistry, type FormRegistryEntry } from '@nocobase/client-v2';

interface StorageType extends FormRegistryEntry {
  // FormRegistryEntry 要求至少有 `name: string`
  title: string;
  Component: React.ComponentType;
}

const storageTypes = createFormRegistry<StorageType>('file-manager/storage-types');

storageTypes.register({ name: 'local', title: '本地存储', Component: LocalStorageForm });
storageTypes.register({ name: 's3', title: 'Amazon S3', Component: S3StorageForm });

storageTypes.get('s3');
storageTypes.list();
storageTypes.has('local');
storageTypes.unregister('local');
```

主要用在：插件需要给「同名 + 同形 + 不同实现」的东西做扩展点（比如 file-manager 的存储类型、verification 的 OTP provider）。比 `Map` 多了 namespace 标识和 HMR 友好的覆盖警告。

`name` 重复注册会用新条目覆盖旧的，同时打 `console.warn`——HMR 时不抛错，开发期能看到意外的重复。

## data-source/

跟数据源 / Collection 注册相关的组件。从 `@nocobase/client-v2` 顶层 export。

### ExtendCollectionsProvider

挂载期 Collection 注入器。在组件挂载时把传入的 collection 注册到目标 data source，卸载时移除；会监听 `dataSource:loaded` 自动重新注入，确保数据源 reload 时不会被清掉。

```tsx
import { ExtendCollectionsProvider } from '@nocobase/client-v2';
import lockedUsersCollection from '../../collections/locked-users';

// 模块级常量——保证引用稳定，避免 provider 每次父级重渲染都重跑 effect
const collections = [lockedUsersCollection];

export function LockedUsersPage() {
  return (
    <ExtendCollectionsProvider collections={collections}>
      <LockedUsersPageInner />
    </ExtendCollectionsProvider>
  );
}
```

主要属性：

- `collections: CollectionOptions[]`：本次要注入的 Collection。Provider 只会注册当时不存在的那些，卸载时也只移除自己注册过的
- `dataSource`：目标 data source key，默认 `'main'`
- `children`：被注入 Collection 覆盖的子树

什么时候用：

- 服务端 collection 是 `schema-only`，不会自动发布到客户端 data source（比如 `lockedUsers`）
- 需要一个纯客户端的 collection 镜像，只对当前页面有效，不污染全局

常见搭配：跟 `<CollectionFilter>` 一起用——前者把 collection 挂上，后者读取并渲染筛选表单。

## 怎么决定加不加新组件

- 出现两个及以上插件需要同一形态的字段或容器——抽到这里
- 跨插件复用、但耦合到具体业务领域（比如「选一个 verifier」「选一个数据源」）——留在业务插件里，从插件的 `client-v2/` 自己 export
- 抽象前先看现有组件能不能改进：比如 `RemoteSelect` 的 `selectItems` 就是为了让带元数据的响应不需要再开新组件

新增组件后别忘记两件事：

1. 在 `form/index.tsx` 加一行 `export * from './XxxComponent'`
2. 回来这份 README 补一节，方便后续插件迁移时找到
