# 管理端菜单 toolbar v2 化重构计划（含仓库内任务跟踪文件）

## Summary
- 目标是完整迁移管理端菜单的 `toolbar / settings / insert actions / delete / drag` 到 v2 写法，并保证每个阶段结束后页面可正常打开、菜单功能可用、设计态不崩。
- 当前跟踪文件固定为：
  `[PLAN.md](/Users/Apple/Projects/nocobase-2.0/PLAN.md)`。
- 这个跟踪文件固定包含：任务编号、任务标题、状态（`pending / in_progress / done`）、commit hash、自动检查结果、手动浏览器测试结果、备注。每完成一个任务，都更新同一文件，把对应任务标记为 `done`。
- 执行顺序固定为：`RouteRepository 服务化` → `flow-engine settings 菜单支持嵌套动作` → `admin-layout 菜单 toolbar/settings 切到 v2，拖拽先兼容旧上下文` → `菜单拖拽切到 v2 DnD`。
- 每个任务都遵循同一 gate：`自动检查通过` → `提交 1 个 commit` → `更新跟踪文件状态` → `通知你做手动浏览器测试` → `收到通过反馈后再进入下一任务`。

## Public APIs / Interfaces
- `RouteRepository` 从只读缓存升级为桌面路由数据服务，新增 `refreshAccessible / listAccessible / createRoute / updateRoute / deleteRoute / moveRoute`，并负责触发路由树刷新。
- flow-engine 的 settings 菜单扩展支持“嵌套 extra actions”，以便保留 `Insert before / Insert after / Insert inner` 仍在 settings 菜单内的交互。
- `AdminLayoutMenuItemModel` 增加 route-backed 的 v2 settings 定义；它不再依赖 flow-engine 的模型持久化保存菜单配置，而是通过 route service 直接修改 `desktopRoutes`。

## Tracking File
- 文件路径固定为 `[PLAN.md](/Users/Apple/Projects/nocobase-2.0/PLAN.md)`。
- 文件内容固定包含两部分：
  1. 当前批准版计划摘要。
  2. 任务跟踪表，列为：`Task`、`Commit`、`Status`、`Auto Checks`、`Manual Browser Test`、`Notes`。
- 创建时所有任务状态为 `pending`。
- 开始做某任务时，将该任务改成 `in_progress`；任务 commit 成功且自动检查通过后改成 `done`，并写入 commit hash；你手动浏览器测试通过后，在该任务备注里记录“manual ok”。
- 若你手动测试失败，在同一任务下追加修复 commit，重复自动检查，直到该任务恢复到可继续推进的稳定状态。

## Task Plan
1. `refactor(route-repository): centralize desktop route ops`
   交付内容：在 `packages/core/client/src/application/RouteRepository.ts` 中下沉桌面路由的增删改移与刷新能力；让 `useNocoBaseRoutes` 退化为 repository 的薄封装；补一个刷新桥，让 model/flow 内调用 repository 变更路由后，`allAccessRoutes` 和 admin-layout 菜单树都能刷新。
   跟踪文件要求：本任务完成后，把 Task 1 状态从 `in_progress` 改为 `done`。
   实现约束：本任务不改菜单 UI，不改 toolbar，不改 drag；现有设计态行为必须保持一致。
   自动检查：新增/更新 repository 与 route-runtime 相关 client 单测；跑相关 `yarn test --client <test-files>`；对改动文件跑 `./node_modules/.bin/eslint <paths>`。
   手动浏览器测试通知内容：进入任意 `/admin` 页面，验证菜单正常渲染、页面切换正常、设计态进入/退出不崩、现有菜单编辑能力无回归。

2. `feat(flow-engine): support nested settings actions`
   交付内容：扩展 flow-engine settings 菜单渲染链，让 `DefaultSettingsIcon` 支持嵌套 extra actions；原有平铺 extra action、flow step 分组、点击回调、禁用态和排序都保持兼容。
   跟踪文件要求：任务开始时把 Task 2 标记 `in_progress`；完成 commit 后改 `done` 并写入自动检查结果。
   实现约束：只改 flow-engine，不接 admin-layout 业务；这一步完成后，所有现有 v2 页面 settings 菜单必须继续可用。
   自动检查：补 `DefaultSettingsIcon` 相关单测，覆盖平铺 extra action、嵌套 extra action、点击回调、禁用态与旧行为不回归；跑相关 `yarn test --client <flow-engine-tests>`；对改动文件跑 eslint；跑一轮 `yarn build:client-v2`。
   手动浏览器测试通知内容：打开任意已有 v2 页面/区块 settings 菜单，确认老菜单仍能打开和保存；确认没有出现空白菜单、重复分组或点击崩溃。

3. `refactor(admin-layout): move menu toolbar to flow settings`
   交付内容：在 `packages/core/client/src/route-switch/antd/admin-layout/AdminLayoutMenuModels.tsx` 中，把菜单 toolbar 从手工 `MenuSchemaToolbar` 切到 `FlowModelRenderer(showFlowSettings)`；在 `AdminLayoutMenuItemModel` 上定义 v2 settings：
   `Edit`、`Edit tooltip`、`Hidden`、`Move to` 走 flow step；
   `Insert before / Insert after / Insert inner` 与 `Delete` 走嵌套 extra actions；
   为菜单 model 覆盖 `saveStepParams`，禁止走 flow-engine 模型持久化；所有保存都直接走 `RouteRepository`。
   跟踪文件要求：任务开始时改 `in_progress`；完成 commit 后改 `done`，写入 commit hash、自动检查结果，并记录“旧 drag 仍保留”。
   实现约束：本任务继续保留旧 `SortableItem` 容器和旧拖拽上下文，只把旧 `schema-component` `DragHandler` 作为 v2 toolbar 的 extra toolbar item；彻底移除 `GroupItem/MenuItem` 中的 `MenuSchemaToolbar`；保留 `x-designer-button`、header/sider 分流、badge、tooltip、移动端禁配逻辑。
   自动检查：补 admin-layout 菜单 model / toolbar 渲染 / settings 动作单测；补 route service 与 menu model 集成测试；跑相关 `yarn test --client <admin-layout-tests>`；对改动文件跑 eslint；跑 `yarn build:client-v2`。
   手动浏览器测试通知内容：在桌面端设计态逐项验证 `Edit`、`Edit tooltip`、`Hidden`、`Move to`、`Insert before`、`Insert after`、`Insert inner`、`Delete`；分别覆盖普通菜单、group 菜单、header 菜单、side 菜单；确认 hover toolbar 可见、点击不崩、操作后菜单即时刷新；确认非设计态和移动端不出现 toolbar。

4. `refactor(admin-layout): migrate menu drag to flow dnd`
   交付内容：把菜单拖拽从旧 `schema.__route__` 数据通路切到 v2 DnD 适配层；拖拽事件以 `menu model uid` 为核心，在自定义 `onDragEnd` 中映射成 `sourceRouteId / targetRouteId` 再调用 `RouteRepository.moveRoute`；去掉对旧 `useMenuDragEnd` 与 `schema.__route__` 的依赖。
   跟踪文件要求：任务开始时改 `in_progress`；完成 commit 后改 `done`，写入 commit hash、自动检查结果和“drag migrated to v2”备注。
   实现约束：优先复用当前顶层 `DndContext` 包裹层，只替换菜单项内部的 draggable/droppable 语义；保持现有菜单拖拽语义不变，不引入新的 group/header/sider 行为差异。
   自动检查：补 admin-layout 菜单拖拽测试，覆盖同级排序、group 内排序、group 间移动、非法 drop 忽略、拖拽后 route refresh；跑相关 `yarn test --client <drag-tests>`；对改动文件跑 eslint；再跑一轮 `yarn build:client-v2`。
   手动浏览器测试通知内容：在设计态验证普通菜单拖拽排序、group 内部拖拽、group 间拖拽、header/sider split menu 场景、折叠菜单场景；确认拖拽前后页面不白屏、不丢菜单、不出现重复节点；确认非设计态不可拖拽。

## Test Plan
- 每个任务都必须新增或更新针对本任务核心风险的 client 单测，不允许只做浏览器点测。
- 每个任务自动检查最少包含：相关 `vitest`、改动文件 `eslint`；任务 2 到任务 4 额外执行 `yarn build:client-v2`。
- 每个任务完成后都输出一份回执给你，至少包含：本次 commit hash、自动检查结果、跟踪文件更新结果、建议你执行的手动浏览器测试步骤、已知未覆盖风险。
- 手动浏览器测试通过前不进入下一任务；如果你反馈失败，当前任务追加修复 commit，并同步更新跟踪文件，不把失败状态带入下一任务。
- 任何任务都必须保持仓库处于“可提交、可回退、可继续开发”的稳定状态，不允许留下双 toolbar 并存、旧新 drag 半混用但行为不一致的中间态。

## Assumptions
- 本轮范围包含完整迁移，最终状态必须覆盖 toolbar、settings、插入动作、删除动作和 drag。
- `Insert before / Insert after / Insert inner` 必须保留在 settings 菜单内，因此 flow-engine settings 菜单会被扩展为支持嵌套 extra actions，而不是改成独立加号按钮。
- 跟踪文件是临时执行文件，路径和文件名固定；后续若不再需要，可在整个重构结束后单独清理。
- commit 使用英文 Angular 风格；推荐 4 个主任务各 1 个主 commit，若某任务因手动测试失败产生修复，则修复 commit 仍归属该任务并同步更新跟踪文件。

## Task Tracking

| Task | Commit | Status | Auto Checks | Manual Browser Test | Notes |
| --- | --- | --- | --- | --- | --- |
| 1. `refactor(route-repository): centralize desktop route ops` | `fceaf2f093` | `done` | `yarn test --client packages/core/client/src/application/__tests__/RouteRepository.test.ts`; `yarn test --client packages/core/client/src/admin-shell/__tests__/route-runtime.test.tsx`; `./node_modules/.bin/eslint packages/core/client/src/application/RouteRepository.ts packages/core/client/src/admin-shell/route-runtime.tsx packages/core/client/src/schema-component/antd/menu/Menu.tsx packages/core/client/src/application/__tests__/RouteRepository.test.ts packages/core/client/src/admin-shell/__tests__/route-runtime.test.tsx` | `manual ok` | 已下沉桌面路由增删改移与刷新桥。 |
| 2. `feat(flow-engine): support nested settings actions` | `d4e831b9f1` | `done` | `yarn test --client packages/core/flow-engine/src/components/settings/wrappers/contextual/__tests__/DefaultSettingsIcon.test.tsx`; `yarn test --client packages/core/flow-engine/src/__tests__/flowSettings.test.ts`; `./node_modules/.bin/eslint packages/core/flow-engine/src/models/flowModel.tsx packages/core/flow-engine/src/components/settings/wrappers/contextual/DefaultSettingsIcon.tsx packages/core/flow-engine/src/components/settings/wrappers/contextual/__tests__/DefaultSettingsIcon.test.tsx`; `yarn build:client-v2` -> blocked: `rsbuild: command not found` | `manual ok` | 已支持嵌套 extra actions，保留现有 settings 菜单兼容；client-v2 构建被本地缺失 `rsbuild` CLI 阻塞。 |
| 3. `refactor(admin-layout): move menu toolbar to flow settings` | `5619248637`, `08f0767b39` | `done` | `yarn test --client packages/core/client/src/route-switch/antd/admin-layout/__tests__/admin-layout-menu-models.test.ts`; `yarn test --client packages/core/flow-engine/src/components/settings/wrappers/contextual/__tests__/DefaultSettingsIcon.test.tsx`; `./node_modules/.bin/eslint packages/core/client/src/route-switch/antd/admin-layout/AdminLayoutMenuModels.tsx packages/core/client/src/route-switch/antd/admin-layout/AdminLayoutShell.tsx packages/core/client/src/route-switch/antd/admin-layout/__tests__/admin-layout-menu-models.test.ts`; `yarn build:client-v2` -> blocked: `rsbuild: command not found` | `manual ok` | 菜单 toolbar/settings 已切到 v2，顶部菜单 settings 下拉主题已修复并完成浏览器回归；旧拖拽保留到任务 4 再迁移；client-v2 构建仍被本地缺失 `rsbuild` CLI 阻塞。 |
| 4. `refactor(admin-layout): migrate menu drag to flow dnd` | `87bac9f64a` | `done` | `yarn test --client packages/core/client/src/route-switch/antd/admin-layout/__tests__/admin-layout-menu-models.test.ts`; `./node_modules/.bin/eslint packages/core/client/src/route-switch/antd/admin-layout/AdminLayoutMenuModels.tsx packages/core/client/src/route-switch/antd/admin-layout/AdminLayoutShell.tsx packages/core/client/src/route-switch/antd/admin-layout/__tests__/admin-layout-menu-models.test.ts`; `yarn build:client-v2` -> blocked: `rsbuild: command not found` | `pending` | 菜单拖拽已切到 v2 DnD：顶层 provider 改为 flow-engine `DndProvider`，菜单节点改为 `Droppable`，拖拽按钮改为 flow-engine `DragHandler`；等待浏览器回归验证拖拽排序与 group 场景。 |
