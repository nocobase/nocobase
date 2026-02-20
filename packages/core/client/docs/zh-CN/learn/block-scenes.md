# 区块的场景

区块的“场景”（Scene）用于控制该区块在“Add block”菜单中的出现位置，以及它预期所处的数据上下文（如新建、单条记录、多条记录、选择器场景）。正确设置场景可以让你的自定义区块只在合适的位置被添加。

## 场景枚举

- BlockSceneEnum.new
  - 用于新建记录的场景（没有既存记录上下文）
  - 典型：新建表单、新建数据的分布表单

- BlockSceneEnum.one
  - 用于单条记录上下文
  - 典型：详情视图、单记录编辑页、与当前记录强相关的小部件

- BlockSceneEnum.many
  - 用于多条记录上下文
  - 典型：表格、看板、日历、图表等列表类区块

- BlockSceneEnum.select
  - 用于“选择记录”的场景（选择器弹窗内）
  - 典型：关系选择器中的表格区块

> 场景不会改变区块的功能实现，但决定该区块能被添加到哪些位置。

## Scene 与 Add block 位置对照

BlockSceneEnum.new

- 主页面的 Add block（新建页/布局中的新建区域）
- 添加记录弹窗的 Add block

BlockSceneEnum.one

- 当前记录弹窗的 Add block（查看/编辑场景）
- 关系字段“查看关系数据”弹窗里的 Add block（单条记录上下文）
- 支持“一对一/属于”关系的弹窗 Add block

BlockSceneEnum.many

- 主页面的 Add block（列表页）
- 支持“多对多/一对多”关系的弹窗 Add block

BlockSceneEnum.select

- 关系选择器弹窗的 Add block（用于自定义选择界面）

## 如何为区块设置场景

在区块的模型类上声明静态 scene 字段即可。通常与 CollectionBlockModel 或 DataBlockModel 等基类配合使用。

```ts
import { CollectionBlockModel, BlockSceneEnum } from '@nocobase/client';

export class SimpleBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.select;
}
```

> 提示：
> - 只有带有正确 scene 的区块，才会在对应位置的 “Add block” 菜单中出现。
> - 如果未设置 scene，是否出现由具体注册逻辑/基类默认值决定；建议显式设置。

## 一个区块支持多个场景

也可以为同一区块添加多个 Scene 标记。例如：

```ts
import { CollectionBlockModel, BlockSceneEnum } from '@nocobase/client';

export class SimpleBlockModel extends CollectionBlockModel {
  static scene = [BlockSceneEnum.one, BlockSceneEnum.many];
}
```

## 与“区块分类”的关系

- 场景（scene）：决定区块在什么位置的 Add block 菜单中出现（新建/单条/多条/选择器）。
- 分类（category）：由区块基类决定其在区块库中的分组（Data/Filter/Other）。
- 两者相互独立：分类影响“区块库分组”；场景影响“可添加的位置”。

相关文档：区块的分类（Block categories）
