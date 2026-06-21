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
  `buildLayoutSnapshot` 使用这些 DOM 节点计算 slot 区域。支持的 slot 类型包括：
  - **ColumnSlot**：列内部插入位置，带 `position: 'before' | 'after'` 标识在元素上方或下方插入
  - **ColumnEdgeSlot**：列边缘，带 `direction: 'left' | 'right'` 标识在左侧或右侧新建列
  - **RowGapSlot**：行间隙，带 `position: 'above' | 'below'` 标识在行上方或下方插入新行
  - **EmptyRowSlot**：空容器，当容器内没有任何元素时的插入位置
  - **EmptyColumnSlot**：空列，当列内没有任何元素时的插入位置（不受配置影响）
- EN: The `Grid` component emits `data-grid-row-id`, `data-grid-column-index`, `data-grid-item-index`, etc.; `buildLayoutSnapshot` uses them to compute slot rectangles. Supported slot types:
  - **ColumnSlot**: Column internal insert position with `position: 'before' | 'after'` indicating insertion above or below an element
  - **ColumnEdgeSlot**: Column edge with `direction: 'left' | 'right'` indicating creating a new column on the left or right
  - **RowGapSlot**: Row gap with `position: 'above' | 'below'` indicating inserting a new row above or below
  - **EmptyRowSlot**: Empty container insertion position when no elements exist
  - **EmptyColumnSlot**: Empty column insertion position when no items in the column (unaffected by config)

## 尺寸处理 / Size Handling

- zh-CN：
  - 所有列宽保持 24 栅格，总和不变。
  - `distributeSizesWithNewColumn` 负责为新增列分配宽度。
  - `normalizeRowSizes` 保证在列增删后尺寸仍然稳定。
- EN:
  - Column widths always sum to 24 units.
  - `distributeSizesWithNewColumn` allocates width for newly inserted columns.
  - `normalizeRowSizes` keeps sizes consistent after column add/remove operations.

## 拖拽高亮区域配置 / Drag Overlay Configuration

- zh-CN：
  - `GridModel` 支持通过 `dragOverlayConfig` 属性配置拖拽时高亮区域的尺寸和偏移。
  - 配置项包括：
    - `columnInsert.before/after`：配置列内插入位置的 `height` 和 `offsetTop`
    - `columnEdge.left/right`：配置列边缘位置的 `width` 和 `offsetLeft`
    - `rowGap.above/below`：配置行间隙位置的 `height` 和 `offsetTop`
  - 空行（EmptyRowSlot）和空列（EmptyColumnSlot）始终使用完整容器尺寸，不受配置影响。
  - 示例：

    ```typescript
    model.dragOverlayConfig = {
      columnInsert: {
        before: { height: 20, offsetTop: -2 },
        after: { height: 20, offsetTop: -2 },
      },
      columnEdge: {
        left: { width: 16, offsetLeft: -4 },
        right: { width: 16, offsetLeft: 4 },
      },
      rowGap: {
        above: { height: 32, offsetTop: -8 },
        below: { height: 32, offsetTop: 8 },
      },
    };
    ```

- EN:
  - `GridModel` supports configuring drag overlay dimensions and offsets via the `dragOverlayConfig` property.
  - Configuration options:
    - `columnInsert.before/after`: Configure `height` and `offsetTop` for column insert positions
    - `columnEdge.left/right`: Configure `width` and `offsetLeft` for column edge positions
    - `rowGap.above/below`: Configure `height` and `offsetTop` for row gap positions
  - Empty rows (EmptyRowSlot) and empty columns (EmptyColumnSlot) always use full container dimensions, unaffected by configuration.
  - Example:

    ```typescript
    model.dragOverlayConfig = {
      columnInsert: {
        before: { height: 20, offsetTop: -2 },
        after: { height: 20, offsetTop: -2 },
      },
      columnEdge: {
        left: { width: 16, offsetLeft: -4 },
        right: { width: 16, offsetLeft: 4 },
      },
      rowGap: {
        above: { height: 32, offsetTop: -8 },
        below: { height: 32, offsetTop: 8 },
      },
    };
    ```

## 测试策略 / Testing Strategy

- zh-CN：
  - `gridDragPlanner.test.ts` (22 个测试)：覆盖 `getSlotKey`、`resolveDropIntent`、`simulateLayoutForSlot` 等核心函数，包括所有 slot 类型（column、column-edge、row-gap、empty-row、empty-column）的处理。
  - `GridModel.dragOverlay.test.ts` (9 个测试)：验证 `DragOverlayConfig` 接口的类型定义和配置结构。
  - `GridModel.computeOverlayRect.test.ts` (15 个测试)：测试各种配置下的 overlay 尺寸计算，确保所有 slot 类型和位置组合都正确应用配置，以及空行/空列不受配置影响。
  - 后续如引入更多 slot 类型或行为，请同步补充测试用例。
- EN:
  - `gridDragPlanner.test.ts` (22 tests): Covers core functions like `getSlotKey`, `resolveDropIntent`, `simulateLayoutForSlot`, including all slot types (column, column-edge, row-gap, empty-row, empty-column).
  - `GridModel.dragOverlay.test.ts` (9 tests): Verifies `DragOverlayConfig` interface type definitions and configuration structure.
  - `GridModel.computeOverlayRect.test.ts` (15 tests): Tests overlay dimension calculations under various configurations, ensuring all slot types and position combinations apply config correctly, and empty rows/columns remain unaffected.
  - Add more test cases whenever new slot types or behaviours are introduced.

## 后续注意事项 / Future Notes

- zh-CN：
  - DOM slot 解析依赖 `Grid` 组件结构，如需重构 UI，请同步更新 `buildLayoutSnapshot`。
  - 拖拽 overlay 位置基于容器 scroll 偏移，滚动行为变化时需回归测试。
  - 新增 slot 类型时，需要在以下位置同步更新：
    1. 定义 slot 接口并添加到 `LayoutSlot` 联合类型
    2. 更新 `getSlotKey` 函数处理新类型
    3. 更新 `simulateLayoutForSlot` 函数添加布局逻辑
    4. 更新 `GridModel.computeOverlayRect` 处理配置应用
    5. 更新 `Grid/index.tsx` 的 `DragOverlayRect` 类型和样式
    6. 添加相应的测试用例
- EN:
  - DOM slot discovery depends on the current `Grid` structure; update `buildLayoutSnapshot` when UI markup changes.
  - Overlay placement uses container scroll offsets; re-run drag tests if scroll handling changes.
  - When adding new slot types, synchronize updates in:
    1. Define slot interface and add to `LayoutSlot` union type
    2. Update `getSlotKey` function to handle the new type
    3. Update `simulateLayoutForSlot` function with layout logic
    4. Update `GridModel.computeOverlayRect` for config application
    5. Update `DragOverlayRect` type and styles in `Grid/index.tsx`
    6. Add corresponding test cases
