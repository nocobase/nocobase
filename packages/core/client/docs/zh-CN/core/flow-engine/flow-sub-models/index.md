
## 示例

### 基础使用

```tsx
<AddSubModelButton
  model={model}
  subModelKey="blocks"
/>
```

* 将子模型添加到 `model.subModels.blocks`。
* 使用 `model.mapSubModels()` 遍历子模型。
* 使用 `<FlowModelRenderer />` 渲染子模型。

---

### 自定义按钮内容

```tsx
<AddSubModelButton model={model} subModelKey="blocks">
  <Button type="primary">添加模块</Button>
</AddSubModelButton>
```

---

### 支持开关功能

```tsx
items=[
  {
    key: 'debug',
    label: '调试模式',
    useModel: 'DebugModel',
    toggleable: true,
  },
]
```

* toggleable 项目仅支持单一实例，点击即可添加/移除。

---

### 异步加载菜单项

```ts
items: async (ctx) => {
  const models = await ctx.api.request('/models');
  return models.map(model => ({
    label: model.name,
    useModel: model.key,
  }));
}
```

* 可结合远程数据源、权限过滤、动态上下文等。

---

### 菜单分组、子菜单与分隔符

```tsx
items=[
  {
    type: 'group',
    label: '基础模块',
    children: [
      { label: '文本块', useModel: 'TextModel' },
      { label: '图片块', useModel: 'ImageModel' },
    ]
  },
  { type: 'divider' },
  {
    label: '高级模块',
    children: [
      { label: '逻辑判断', useModel: 'IfModel' },
      { label: '脚本块', useModel: 'ScriptModel' },
    ]
  }
]
```

---

### 基于继承类自动生成

```tsx
<AddSubModelButton
  model={model}
  subModelKey="blocks"
  subModelBaseClass="BaseBlock"
/>
```

* 自动收集所有继承自 `BaseBlock` 的模型。

---

### 多基类分组展示

```tsx
<AddSubModelButton
  model={model}
  subModelKey="blocks"
  subModelBaseClasses={["LogicBlock", "UIBlock"]}
/>
```

* 自动按继承来源分组去重展示。

---

### 通过 `Model.defineChildren()` 自定义菜单结构

```ts
MyModel.defineChildren(() => [
  { label: '模块 A', useModel: 'ModelA' },
  { type: 'divider' },
  {
    type: 'group',
    label: '高级模块',
    children: [
      { label: '模块 B', useModel: 'ModelB' },
    ]
  }
])
```

---

## 注意事项

* 按钮必须放在有效的 `FlowModel` 上下文中。
* 使用 `toggleable` 时，一个模型只应添加一次。
* 使用 `model.mapSubModels()` 遍历子模型，避免遗漏排序、过滤逻辑。
* 异步 items 和 children 需返回 Promise。
* 所引用的 `useModel` 类型必须事先通过 `ModelManager` 注册。

---

如需更多高级用法或问题排查，建议结合 `FlowModel`、`ModelManager` 等模块文档一起阅读。
