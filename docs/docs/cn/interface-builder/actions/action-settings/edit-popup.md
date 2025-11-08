# 编辑弹窗

## 介绍

凡是点击能打开弹窗的操作/字段，都支持配置弹窗的打开方式、尺寸等。

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## 打开方式

- 抽屉

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- 对话框

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- 子页面

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## 弹窗尺寸

- 大
- 中（默认）
- 小

## 弹窗 UID

“弹窗 UID”是用于打开该弹窗的组件 UID, 它也对应当前地址栏中的 `view/:viewUid` 的 viewUid 段。您可以在触发弹窗的字段或按钮的设置菜单中，点击“复制弹窗 UID”快速获取。

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

通过设置弹窗 UID 能过达到弹窗复用的效果。

### 内部弹窗（默认）
- “弹窗 UID” 等于当前操作按钮的 UID（默认即为本按钮 UID）。

### 外部弹窗（弹窗复用）
- 在“弹窗 UID”中填写其他位置的触发按钮 UID（即弹窗 UID），用于复用那一个弹窗。
- 典型用途：多个页面/区块共用同一套弹窗界面与逻辑，避免重复配置。
- 外部弹窗时，部分配置无法修改 （见下文）。

## 其它相关配置

- `Data source / Collection`：只读展示，用于说明该弹窗绑定的数据来源；默认取当前区块的集合。外部弹窗模式下沿用目标弹窗的配置，无法修改此配置。
- `Association name`：可选。用于从“关联字段”上打开弹窗，当存在默认值时才显示。外部弹窗模式下沿用目标弹窗的配置，无法修改此配置。
- `Source ID`：仅在设置了 `Association name` 时出现，默认使用当前上下文的 `sourceId`，可按需改为变量或固定值。
- `filterByTk`：可为空、可选变量，或固定值，用于限定弹窗数据记录。

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)