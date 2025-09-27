# Grid 拖拽设计 / Grid Drag Planner

> zh-CN 版本在前，English version follows after each section.

## 背景 / Background

- zh-CN：本模块负责区块栅格的拖拽预览与布局模拟，替换旧的基于方向推断的 `moveBlock` 实现。
- EN: This module powers grid block drag preview and layout simulation, replacing the legacy direction-based `moveBlock` helper.

## 核心概念 / Key Concepts

- zh-CN：
  - **Snapshot**：在拖拽开始时记录 `rows`、`sizes` 以及 DOM slot 信息，保证预览可随时回滚。
  - **Slots**：通过 DOM `data-grid-*` 标识生成的投放槽，涵盖列内部、列边缘、行间隙与空容器。
  - **Simulation**：`simulateLayoutForSlot` 基于快照创建新布局，确保源节点先从原位置移除再插入目标 slot。
- EN:
  - **Snapshot**: Captures `rows`, `sizes`, and DOM slots on drag start so previews can be reverted safely.
  - **Slots**: Drop targets described by DOM `data-grid-*` attributes covering column, column-edge, row-gap and empty container.
  - **Simulation**: `simulateLayoutForSlot` works on a cloned snapshot, removing the source first and inserting into the chosen slot.

## 事件流程 / Drag Lifecycle

- zh-CN：
  1. `handleDragStart`：构建快照、初始化 overlay 状态并安排 slot 刷新。
  2. `handleDragMove`：解析当前指针坐标，匹配最优 slot，调用 `simulateLayoutForSlot` 生成预览，并更新 overlay。
  3. `handleDragEnd`：若存在有效 slot，提交 `rows/sizes` 并保存；否则回滚至快照。
  4. `handleDragCancel`：直接恢复快照并清空 overlay。
- EN:
  1. `handleDragStart`: Build the snapshot, reset overlay state, schedule slot refresh.
  2. `handleDragMove`: Resolve pointer position, match the closest slot, call `simulateLayoutForSlot`, and update overlay.
  3. `handleDragEnd`: Commit `rows/sizes` and persist when a valid slot exists, otherwise restore snapshot.
  4. `handleDragCancel`: Restore snapshot immediately and clear the overlay.

## Slot 类型与数据标识 / Slot Types & Data Attributes

- zh-CN：`Grid` 组件为行、列、项生成 `data-grid-row-id`、`data-grid-column-index`、`data-grid-item-index` 等属性；
  `buildLayoutSnapshot` 使用这些 DOM 节点计算 slot 区域。
- EN: The `Grid` component emits `data-grid-row-id`, `data-grid-column-index`, `data-grid-item-index`, etc.; `buildLayoutSnapshot` uses them to compute slot rectangles.

## 尺寸处理 / Size Handling

- zh-CN：
  - 所有列宽保持 24 栅格，总和不变。
  - `distributeSizesWithNewColumn` 负责为新增列分配宽度。
  - `normalizeRowSizes` 保证在列增删后尺寸仍然稳定。
- EN:
  - Column widths always sum to 24 units.
  - `distributeSizesWithNewColumn` allocates width for newly inserted columns.
  - `normalizeRowSizes` keeps sizes consistent after column add/remove operations.

## 测试策略 / Testing Strategy

- zh-CN：新增的 `gridDragPlanner.test.ts` 覆盖列内插入、列边缘、行间隙与空容器等关键路径；
  后续如引入更多 slot 类型，请同步补充测试用例。
- EN: The new `gridDragPlanner.test.ts` covers column, column-edge, row-gap and empty container scenarios; add more cases whenever new slot types or behaviours are introduced.

## 后续注意事项 / Future Notes

- zh-CN：
  - DOM slot 解析依赖 `Grid` 组件结构，如需重构 UI，请同步更新 `buildLayoutSnapshot`。
  - 拖拽 overlay 位置基于容器 scroll 偏移，滚动行为变化时需回归测试。
- EN:
  - DOM slot discovery depends on the current `Grid` structure; update `buildLayoutSnapshot` when UI markup changes.
  - Overlay placement uses container scroll offsets; re-run drag tests if scroll handling changes.
