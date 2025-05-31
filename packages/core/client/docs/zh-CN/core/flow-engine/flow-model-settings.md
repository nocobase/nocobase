# FlowModelSettings

`FlowModelSettings` 是用于管理和配置 FlowModel 上所有流程（Flow）的专用组件。它为用户提供了多种交互入口，方便在不同场景下快捷地查看、编辑和管理模型的流程设置。

---

## 常见用法

除了和 FlowModelRenderer 集成，也可以单独使用，例如：

### 悬浮菜单

```tsx | pure
<FlowModelSettingsDropdown model={model}>
  <a>Click me</a>
</FlowModelSettingsDropdown>
```

### 右键菜单

```tsx | pure
<FlowModelSettingsContextMenu model={model}>
  <a>Click me</a>
</FlowModelSettingsContextMenu>
```

### 对话框

```tsx | pure
<FlowModelSettingsModal model={model}>
  <a>Click me</a>
</FlowModelSettingsModal>
```

### 抽屉

```tsx | pure
<FlowModelSettingsDrawer model={model}>
  <a>Click me</a>
</FlowModelSettingsDrawer>
```
