# AddSubModel

## 参数说明

```ts
export interface AddSubModelButtonProps {
  // 往哪个 model 里添加子 model
  model: FlowModel;
  // 子 model 的 key，也就是 model.subModels.subModelKey
  subModelKey: string;
  // 子 model 是对象还是数组
  subModelType?: 'object' | 'array';
  // 可以使用的子 model 列表
  items?: SubModelItemsType;
  // 继承此基类的 Model 都会罗列出来
  subModelBaseClass?: string | ModelConstructor;
  // 继承此基类的 Model 都会罗列出来，并按基类分组展示
  subModelBaseClasses?: Array<string | ModelConstructor>;
  // 子 model 初始化时触发
  afterSubModelInit?: (subModel: FlowModel) => Promise<void>;
  // 子 model 添加之后触发
  afterSubModelAdd?: (subModel: FlowModel) => Promise<void>;
  // 子 model 移除之后触发
  afterSubModelRemove?: (subModel: FlowModel) => Promise<void>;
  // 按钮的标题
  children?: React.ReactNode;
  keepDropdownOpen?: boolean;
}

export type SubModelItemsType = SubModelItem[] | ((ctx: FlowModelContext) => SubModelItem[] | Promise<SubModelItem[]>);

export interface SubModelItem {
  // 标识
  key?: string;
  // 显示文案
  label?: string;
  // 类型
  type?: 'group' | 'divider';
  // 是否禁用
  disabled?: boolean;
  // 图标
  icon?: React.ReactNode;
  // type 为空时，为子菜单
  // type: group 时，为菜单分组
  children?: SubModelItemsType;
  // 使用哪个 Model
  useModel?: string;
  // model 的初始化参数
  createModelOptions?: { props?: Record<string, any>; stepParams?: Record<string, any> };
  // 支持开关功能，开表示添加，关表示移除。
  toggleable?: boolean;
}
```

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

- 添加 `toggleable: true` 标记即可
- toggleable 的 Model 只能有一个

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
