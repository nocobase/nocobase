# FlowModelRenderer

`FlowModelRenderer` 用于渲染单个 `FlowModel`，并可通过 `showFlowSettings` 控制 Flow Settings 的显示与交互。

---

## 递归控制 Flow Settings 显示（showFlowSettings.recursive）

### 示例 0：上层递归开启，中层不递归（recursive=false）

<code src="./demos/show-flow-settings-recursive-false.tsx"></code>

A 开启 `showFlowSettings={{ recursive: true }}`，B 设置 `showFlowSettings={{ enabled: false, recursive: false }}` 并阻断递归继承；C 不再受 A 影响（保持默认关闭）。

### 示例 1：中间节点仅影响自身

<code src="./demos/show-flow-settings-recursive.tsx"></code>

A 开启 `showFlowSettings={{ recursive: true }}`，B 显式关闭（不递归），C 仍继承 A 的开启。

### 示例 2：中间节点递归影响后代

<code src="./demos/show-flow-settings-recursive-child-recursive.tsx"></code>

A 开启 `showFlowSettings={{ recursive: true }}`，B 关闭并设置 `recursive: true`，C 跟随 B 关闭。
