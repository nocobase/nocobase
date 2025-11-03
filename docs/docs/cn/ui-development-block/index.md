# 区块扩展概述

在 NocoBase 2.0 中，区块扩展的机制被大幅简化。开发者只需继承相应的 **FlowModel** 基类并实现相关接口方法（主要是 `renderComponent()` 方法），即可快速自定义区块。

## 区块分类

NocoBase 将区块分为三类，在配置界面中按组展示：

- **数据区块（Data blocks）**：继承 `DataBlockModel` 或 `CollectionBlockModel` 的区块
- **筛选区块（Filter blocks）**：继承 `FilterBlockModel` 的区块
- **其他区块（Other blocks）**：直接继承 `BlockModel` 的区块

> 区块所属分组由对应基类决定，判定逻辑基于继承关系，无需额外配置。

## 基类说明

系统提供了四种用于扩展的基类：

### BlockModel

**基础区块模型**，是最通用的区块基类。

- 适合纯展示等不依赖数据的区块
- 会划分到 **Other blocks** 分组
- 适用于个性化的场景

### DataBlockModel

**数据区块模型（不绑定数据表）**，面向自定义数据来源的区块。

- 不直接绑定数据表，可以自定义数据获取逻辑
- 会划分到 **Data blocks** 分组
- 适用于：调用外部 API、自定义数据处理、统计图表等场景

### CollectionBlockModel

**数据表区块模型**，需要绑定数据表的区块。

- 需要绑定数据表的模型基类
- 会划分到 **Data blocks** 分组
- 适用于：列表、表单、看板等明确依赖某个数据表的区块

### FilterBlockModel

**筛选区块模型**，用于构建筛选条件的区块。

- 用于构建筛选条件的模型基类
- 会划分到 **Filter blocks** 分组
- 通常与数据区块联动

## 如何选择基类

在选择基类时，可以遵循以下原则：

- **需要绑定某个数据表**：优先选择 `CollectionBlockModel`
- **自定义数据来源**：选择 `DataBlockModel`
- **用于设置筛选条件并与数据区块联动**：选择 `FilterBlockModel`
- **不知道如何划分**：选择 `BlockModel`

## 快速开始

创建自定义区块只需三个步骤：

1. 继承相应的基类（如 `BlockModel`）
2. 实现 `renderComponent()` 方法返回 React 组件
3. 在插件中注册区块模型

详细示例请参考 [编写一个区块插件](./write-a-block-plugin)。
