# 扩展设置菜单（Common actions）

<!-- markdownlint-disable MD010 MD033 MD029 -->

通过 `FlowModel.registerExtraMenuItems()` 可以为指定的模型类注册额外的设置菜单项。

- 注册的菜单项会出现在右上角 Flow Settings 的 “Common actions” 分组中；
- 适合插件注入「转换/快捷操作」等能力（无需侵入 DefaultSettingsIcon 实现）。

<code src="./index.tsx"></code>

