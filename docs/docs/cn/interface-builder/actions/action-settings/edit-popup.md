# 编辑弹窗

## 介绍

凡是点击能打开弹窗的操作/字段，都支持配置弹窗的打开方式、尺寸等。

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![edit-popup-full-20251228](https://static-docs.nocobase.com/edit-popup-full-20251228.png)

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

## 弹窗模板

弹窗模板用于复用一套弹窗界面与交互逻辑。


### 保存弹窗为模板

1) 打开能触发弹窗的按钮/字段设置菜单，点击 `保存为模板`  
2) 填写模板名称/描述，并选择保存模式：
   - `将当前弹窗转为模板`：保存后，当前弹窗将切换为引用该模板
   - `复制当前弹窗为模板`：仅创建模板，当前弹窗保持不变

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### 在弹窗配置中使用模板

1) 打开该按钮/字段的弹窗配置  
2) 在 `弹窗模板` 中选择模板即可复用

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### 使用条件（模板可用范围）

弹窗模板与触发弹窗的操作场景有关。选择器会根据当前场景自动过滤/禁用不兼容的模板（不满足条件时会提示原因）。

- **Collection 操作按钮**：只能使用 **Collection 操作**创建的弹窗模板，且 **Collection（数据表）必须一致**。
- **非关联 Record 操作**：可使用 **非关联 Record 操作**创建的弹窗模板，以及 **Collection 操作**创建的弹窗模板，且 **Collection（数据表）必须一致**。
- **关联 Record 操作**：可使用 **非关联 Record 操作**创建的弹窗模板，以及 **Collection 操作**创建的弹窗模板，且 **Collection（数据表）必须一致**；也可使用 **关联 Record 操作**创建的弹窗模板，但需要严格匹配**同一个关联字段**的操作（同一关联关系）。

### 引用与复制的区别

- `引用`：使用模板打开弹窗；模板更新会同步影响所有引用处。
- `复制`：通过 `将引用转换为复制` 断开模板引用；后续修改仅影响当前弹窗。

### 管理弹窗模板

系统设置 → `界面模板` → `弹窗模板 (v2)` 中可查看/搜索/编辑/删除模板。

> 注意：若模板正在被引用中，则无法直接删除。请先在引用该模板的弹窗上使用 `将引用转换为复制` 断开引用，再删除模板。

### 将引用转换为复制

当弹窗正在引用模板时，可在设置菜单中使用 `将引用转换为复制`，把当前弹窗改为独立配置，后续修改互不影响。

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)
