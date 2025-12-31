---
pkg: "@nocobase/plugin-ui-templates"
---

# 区块模板

## 介绍

区块模板用于复用已配置好的区块，避免在不同页面/位置重复搭建与配置。

## 保存区块为模板

1) 打开目标区块的设置菜单，点击 `保存为模板`  
2) 填写 `模板名称` / `模板描述`，并选择保存模式：
   - `将当前区块转为模板`：保存后，当前位置将替换为 `区块模板` 区块（引用该模板）
   - `复制当前区块为模板`：仅创建模板，当前区块保持不变

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

## 使用区块模板

1) 添加区块 → “其他区块” → `区块模板`  
2) 在配置中选择：
   - `模板`：选择一个模板
   - `模式`：
     - `引用`：引用模板，所有引用处保持同步
     - `复制`：生成独立区块，后续互不影响

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### 引用与复制的区别

- `引用`：所有引用处共享同一份区块配置；修改模板或任一引用处，其他引用处都会同步更新。
- `复制`：仅在复制时生成一份独立区块；后续对模板或其它区块的修改不会同步到这里。

## 管理区块模板

系统设置 → `界面模板` → `区块模板 (v2)` 中可查看/搜索/编辑/删除模板。

> 注意：若模板正在被引用中，则无法直接删除。请先在引用该模板的区块上使用 `将引用转换为复制` 断开引用，再删除模板。

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

## 将引用转换为复制

当区块正在引用模板时，可在区块设置菜单中使用 `将引用转换为复制`，把当前区块改为普通区块。

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

## 注意事项

- `复制` 模式会重新生成区块及子节点的 UID，部分依赖 UID 的配置可能需要重新配置。
