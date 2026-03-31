# hideInSettings - 在设置界面中隐藏

`hideInSettings` 支持两种形态：
- 布尔值：`true` 静态隐藏；`false` 显式展示
- 函数：基于上下文动态决定是否隐藏

## 示例：静态值（true / false）
同一个流程里包含两个静态步骤：`name` 使用 `hideInSettings: true` 仅在创建时出现；`description` 使用 `hideInSettings: false` 始终在设置菜单中展示。
<code src="./static.tsx"></code>

## 示例：函数式动态隐藏
`display` 步骤提供开关，`extra` 步骤通过函数式 `hideInSettings` 读取 `display` 的参数，按需决定是否显示。
<code src="./index.tsx"></code>
