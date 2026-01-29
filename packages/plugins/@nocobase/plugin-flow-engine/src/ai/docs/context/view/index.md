# ctx.view

当前视图控制器（如页面、弹窗、抽屉等），用于在 JSBlock / Action 中访问视图级别的信息或操作。

> 具体能力依赖视图类型，不在本页展开完整 API，这里仅给出概念说明。

## 常见用途

- 读取当前视图的参数（通常通过 `ctx.getVar` / `ctx.inputArgs` 获取）
- 与 `ctx.openView` / `ctx.viewer` 配合，控制视图的打开/关闭

- type
- inputArgs
- inputArgs.viewUid