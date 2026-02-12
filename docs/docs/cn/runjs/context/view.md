# ctx.view

当前视图控制器（页面、弹窗、抽屉等），在 JSBlock / Action 中用于访问视图级信息或操作。

> 能力因视图类型而异，此处仅作概念性说明，不列完整 API。

## 常用场景

- 读取当前视图参数（通常通过 `ctx.getVar` / `ctx.inputArgs`）
- 与 `ctx.openView` / `ctx.viewer` 配合控制打开/关闭视图

常见属性示例：`type`、`inputArgs`、`inputArgs.viewUid` 等。
