# AddSubModelButton

用于在指定的 `FlowModel` 中添加子模型（subModel）。支持异步加载、分组、子菜单、自定义模型继承规则等多种配置方式。

---

## Props

```ts
interface AddSubModelButtonProps {
  model: FlowModel;
  subModelKey: string;
  subModelType?: 'object' | 'array';
  items?: SubModelItemsType;
  subModelBaseClass?: string | ModelConstructor;
  subModelBaseClasses?: Array<string | ModelConstructor>;
  afterSubModelInit?: (subModel: FlowModel) => Promise<void>;
  afterSubModelAdd?: (subModel: FlowModel) => Promise<void>;
  afterSubModelRemove?: (subModel: FlowModel) => Promise<void>;
  children?: React.ReactNode;
  keepDropdownOpen?: boolean;
}
```

| 参数                    | 类型                                                            | 说明                                  |
| --------------------- | ------------------------------------------------------------- | ----------------------------------- |
| `model`               | `FlowModel`                                                   | **必填**。要添加子模型的目标模型。                 |
| `subModelKey`         | `string`                                                      | **必填**。子模型在 `model.subModels` 中的键名。 |
| `subModelType`        | `'object' \| 'array'`                                         | 子模型的数据结构类型，默认为 `'array'`。           |
| `items`               | `SubModelItem[]` \| `(ctx) => SubModelItem[] \| Promise<...>` | 菜单项定义，支持静态或异步生成。                    |
| `subModelBaseClass`   | `string` \| `ModelConstructor`                                | 指定一个基类，列出继承该类的所有模型作为菜单项。            |
| `subModelBaseClasses` | `(string \| ModelConstructor)[]`                              | 指定多个基类，自动按组列出继承模型。                  |
| `afterSubModelInit`   | `(subModel) => Promise<void>`                                 | 子模型初始化后回调。                          |
| `afterSubModelAdd`    | `(subModel) => Promise<void>`                                 | 子模型添加后回调。                           |
| `afterSubModelRemove` | `(subModel) => Promise<void>`                                 | 子模型移除后回调。                           |
| `children`            | `React.ReactNode`                                             | 按钮内容，可自定义为文字或图标。                    |
| `keepDropdownOpen`    | `boolean`                                                     | 添加后是否保持下拉菜单展开。默认自动关闭。               |

---

## SubModelItem 类型定义

```ts
interface SubModelItem {
  key?: string;
  label?: string;
  type?: 'group' | 'divider';
  disabled?: boolean;
  icon?: React.ReactNode;
  children?: SubModelItemsType;
  useModel?: string;
  createModelOptions?: {
    props?: Record<string, any>;
    stepParams?: Record<string, any>;
  };
  toggleable?: boolean | ((model: FlowModel) => boolean);
}
```

| 字段                   | 类型                       | 说明                         |
| -------------------- | ------------------------ | -------------------------- |
| `key`                | `string`                 | 唯一标识。 |
| `label`              | `string`                 | 显示文本。                      |
| `type`               | `'group'` \| `'divider'` | 分组或分隔符。省略时为普通项或子菜单。        |
| `disabled`           | `boolean`                | 是否禁用当前项。                   |
| `icon`               | `React.ReactNode`        | 图标内容。                      |
| `children`           | `SubModelItemsType`      | 子菜单项，用于嵌套分组或子菜单。           |
| `useModel`           | `string`                 | 指定使用的 Model 类型（注册名）。       |
| `createModelOptions` | `object`                 | 初始化模型时的参数。                 |
| `toggleable`         | `boolean` \| `(model: FlowModel) => boolean` | 开关形态，已添加则移除，未添加则添加（只允许一个）。 |

---

## 示例

### 使用 `<AddSubModelButton/>` 添加 subModels

<code src="./demos/add-sub-model-basic.tsx"></code>

- 使用 `<AddSubModelButton />` 添加 subModels，按钮必须放到某个 FlowModel 里才能使用；
- 使用 `model.mapSubModels()` 遍历 subModels，mapSubModels 方法会解决缺失、排序等问题；
- 使用 `<FlowModelRenderer />` 渲染 subModels。

### 不同形态的 AddSubModelButton

<code src="./demos/add-sub-model-icon.tsx"></code>

- 可以使用按钮组件 `<Button>Add block</Button>`，可以随处放置
- 也可以使用使用图标 `<PlusOutlined />`
- 也可以放到右上角 Flow Settings 的位置

### 支持开关形态

<code src="./demos/add-sub-model-toggleable.tsx"></code>

- 简单场景 `toggleable: true` 即可，默认根据类名查找，同一个类的实例只允许出现一次
- 自定义查找规则：`toggleable: (model: FlowModel) => boolean`

### 异步 items

<code src="./demos/add-sub-model-async-items.tsx"></code>

可以从上下文获取动态 items，例如：

- 可以是远程 `ctx.api.request()`；
- 也可以从 `ctx.dataSourceManager` 提供的 API 里获取必要的数据；
- 也可以是自定义的上下文属性或方法；
- items 和 children 都支持 async 调用。

### 使用分组、子菜单和分隔符

<code src="./demos/add-sub-model-basic-children.tsx"></code>

- `type: divider` 时为分隔符
- `type: group` 并有 children 是为菜单分组
- 有 children，但是没有 type 时为子菜单

### 通过继承类的方式自动生成 items

<code src="./demos/add-sub-model-base-class.tsx"></code>

- 所有继承 `subModelBaseClass` 的 FlowModel 都会罗列出来
- 通过 `Model.define()` 可以定义相关元数据
- 使用 `hide: true` 标记的会自动隐藏

### 通过继承类的方式实现分组

<code src="./demos/add-sub-model-base-class-group.tsx"></code>

- 所有继承 `subModelBaseClasses` 的 FlowModel 都会罗列出来
- 自动按 `subModelBaseClasses` 分组并去重

### 通过 Model.defineChildren() 的方式自定义子菜单

<code src="./demos/add-sub-model-define-children.tsx"></code>

### 通过 Model.defineChildren() 的方式自定义 group children

<code src="./demos/add-sub-model-group-children.tsx"></code>

### 在子菜单中启用搜索

<code src="./demos/add-sub-model-submenu-search.tsx"></code>

- 任何包含 `children` 的菜单项只要设置 `searchable: true`，即会在该层级显示搜索框
- 支持同级存在 group 与非 group 的混合结构，搜索仅作用于当前层级

<!-- ### 通过 CollectionBlockModel.getChildrenFilters() 限制可用Collections -->
<!-- <code src="./demos/collection-comments-define-children.tsx"></code> -->
