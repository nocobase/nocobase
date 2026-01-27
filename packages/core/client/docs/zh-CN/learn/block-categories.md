# 区块的分类

本文介绍区块如何分组展示、各分组对应的基类含义，以及开发自定义区块时如何选择合适的基类。

## 分类规则

NocoBase 将区块分为三类，在配置界面中按组展示：

- 数据区块（Data blocks）
- 筛选区块（Filter blocks）
- 其他区块（Other blocks）

区块所属分组由对应基类决定：

- 继承 DataBlockModel 或 CollectionBlockModel 的区块，会划分到 Data blocks 分组
- 继承 FilterBlockModel 的区块，会划分到 Filter blocks 分组
- 直接继承 BlockModel 的区块，会划分到 Other blocks 分组

> 判定逻辑基于继承关系，无需额外配置。

## 基类说明

- CollectionBlockModel
  - 需要绑定数据表的模型基类
  - 适合列表、表单、看板等明确依赖某个数据表的区块

- DataBlockModel
  - 不直接绑定数据表的区块
  - 适合面向自定义数据来源的区块

- FilterBlockModel
  - 用于构建筛选条件的模型基类
  - 适合条件条、筛选器面板等，通常与数据区块联动

- BlockModel
  - 通用区块模型基类
  - 适合纯展示等不依赖数据的区块

## 配置界面中的分组

继承 DataBlockModel 和 CollectionBlockModel 的区块，会划分到 Data blocks 分组里：

![数据区块分组示意](https://static-docs.nocobase.com/20250919224740.png)

继承 FilterBlockModel 的区块，会划分到 Filter blocks 分组里：

![筛选区块分组示意](https://static-docs.nocobase.com/20250919224939.png)

其余直接继承 BlockModel 的区块，会划分到 Other blocks 分组里：

![其他区块分组示意](https://static-docs.nocobase.com/20250919224453.png)

## 该选哪个基类

- 如果区块需要绑定某个数据表：优先选择 CollectionBlockModel
- 如果区块自定义数据来源：选择 DataBlockModel
- 如果区块用于设置筛选条件并与数据区块联动：选择 FilterBlockModel
- 如果不知道怎么划分：选择 BlockModel

## 插件示例

待补充