---
displayName: "区块：引用"
packageName: '@nocobase/plugin-block-reference'
description: |
  通过目标区块的 UID 进行复用，支持“引用/复制”两种模式。实验性功能，生产环境请谨慎使用。
isFree: true
builtIn: true
defaultEnabled: false
supportedVersions:
  - 2.x
---

# 区块：引用

## 功能简介
引用区块通过填写目标区块的 UID，把已配置好的区块直接展示在当前页面，无需重复配置。

## 启用插件
本插件为内置但默认未启用。
打开“插件管理” → 找到“区块：引用” → 点击“启用”。

![启用引用区块（插件管理器）](https://static-docs.nocobase.com/block-ref-enable-20251102.png)

## 如何添加
1）添加区块 → “其他区块”分组 → 选择“引用区块”。  
2）在“引用区块配置”中填写：
   - `区块 UID`：目标区块的 UID
   - `引用模式`：选择 `引用` 或 `复制`（见下文）

![引用区块添加与配置演示](https://static-docs.nocobase.com/20251102211459_rec_.gif)

### 如何获取区块 UID
- 打开目标区块的设置菜单，点击 `复制 UID` 即可复制该区块的 UID。  

![block-reference-copy-uid-20251102](https://static-docs.nocobase.com/block-ref-copy-uid-20251102.png)

## 模式与行为
- `引用`（默认）
  - 与原区块共用同一份配置；修改原区块或任一引用处，所有引用都会同步更新。

- `复制`
  - 生成一份与原始区块一样的独立区块，后续各自修改互不影响、不同步。

## 配置说明
- 引用区块：
  - `引用区块配置`：用于指定目标区块 UID，并选择“引用/复制”模式。
  - 同时会呈现“被引用区块”的完整设置（相当于在原始区块上直接配置）。

![引用区块配置界面](https://static-docs.nocobase.com/block-ref-settings-20251102.png)

- 复制区块：
  - 复制后得到的区块与原始区块类型相同，仅包含该区块自身的设置。
  - 不再包含 `引用区块配置`。

## 异常与占位
- 目标缺失/无效时：显示错误状态提示。可在引用区块的设置中重新指定区块 UID（引用区块配置 → 区块 UID），保存后恢复显示。  

![目标区块无效时的错误状态](https://static-docs.nocobase.com/block-ref-error-20251102.png)

## 注意与限制
- 试验性功能，生产环境请谨慎使用。
- 复制区块时部分依赖目标 UID 的配置可能需要重新配置。
- 引用区块所有的配置都会自动同步，包括“数据范围”等配置。但引用区块可以有自己的[事件流配置](../../../interface-builder/event-flow/)，因此可通过事件流及自定义 JavaScript 操作来间接达到不同的数据范围等配置。
