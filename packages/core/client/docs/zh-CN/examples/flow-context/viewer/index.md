# ctx.viewer

:::info
`ctx.viewer` 由 `FlowEngineContext` 提供，全局可用。
:::

`ctx.viewer` 提供了一套统一视图管理的 API，用于在 Model、Flow、Component 等任意位置（命令式）打开弹窗、抽屉、Popover、嵌入式视图等，并支持灵活的内容渲染、参数传递、Header/Footer 配置、关闭与更新等操作。

## 常用方法

- `ctx.viewer.open(options)`  
  通用方法，根据 `type` 字段打开对应类型的视图（如 `dialog`、`drawer`、`popover`、`embed` 等）。
- `ctx.viewer.dialog(options)`  
  快捷方法，直接打开对话框。
- `ctx.viewer.drawer(options)`  
  快捷方法，直接打开抽屉。
- `ctx.viewer.popover(options)`  
  快捷方法，直接打开气泡弹层。
- `ctx.viewer.embed(options)`  
  快捷方法，直接在指定区域嵌入内容。

所有方法均支持 `content` 为函数（可获得当前视图实例），也支持配置 Header、Footer 等局部内容（目前仅 dialog 和 drawer 支持）。

## 支持的视图类型

- **对话框**（Dialog/Modal）：模态弹窗，常用于表单、确认等场景
- **抽屉**（Drawer）：侧边滑出的面板，适合展示较多内容
- **气泡卡片**（Popover）：悬浮气泡，适合轻量级提示或操作
- **嵌入式区域**（Embed）：将内容嵌入到页面指定容器

## 示例

### 对话框

<code src="./dialog.tsx"></code>

Header + Footer

<code src="./dialog-header-footer.tsx"></code>

useFlowView + useFlowContext

<code src="./dialog-hook.tsx"></code>

### 抽屉

<code src="./drawer.tsx"></code>

Header + Footer

<code src="./drawer-header-footer.tsx"></code>

useFlowView + useFlowContext

<code src="./drawer-hook.tsx"></code>

### 内嵌视图

<code src="./embed.tsx"></code>

### 气泡卡片

<code src="./popover.tsx"></code>
