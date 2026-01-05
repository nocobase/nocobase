---
pkg: "@nocobase/plugin-multi-space"
---

# 多空间

<PluginInfo name="multi-space" licenseBundled="professional"></PluginInfo>

## 介绍

**多空间插件**允许在单一应用实例中，通过逻辑隔离实现多个独立的数据空间。  

#### 适用场景
- **多门店或工厂**：业务流程和系统配置高度一致，例如统一的库存管理、生产计划、销售策略和报表模板，但需要保证每个业务单元的数据互不干扰。
- **多组织或子公司管理**：集团公司下属多个组织或子公司共用同一平台，但每个品牌有独立的客户、产品和订单数据。


## 安装

在插件管理中找到 **多空间（Multi-Space）** 插件，并启用。

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)


## 使用手册

### 多空间管理

启用插件后，进入 **「用户与权限」** 设置页面，切换到 **空间** 面板即可管理空间。

> 初始状态下会存在一个内置的 **未分配空间（Unassigned Space）**，主要用于查看未关联空间的老数据。

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### 创建空间

点击「添加空间」按钮创建新的空间：

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### 分配用户

选择已创建的空间后，可在右侧设置该空间所属的用户：

> **提示：** 空间分配用户后需 **手动刷新页面**，右上角的空间切换列表才会更新显示最新的空间。

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)


### 多空间切换与查看

在右上角可以切换当前空间。  
点击右侧的 **眼睛图标**（高亮状态）时，可同时查看多个空间的数据。

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### 多空间数据管理

开启插件后，在创建数据表（Collection）时系统会自动预置一个 **空间字段**。  
**只有包含该字段的表，才会被纳入空间管理逻辑中**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

对于已有的数据表，可手动添加空间字段以启用空间管理：

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### 默认逻辑

在包含空间字段的数据表中，系统会自动应用以下逻辑：

1. 创建数据时，自动关联当前选中空间；
2. 筛选数据时，自动限定为当前选中空间的数据。


### 老数据的多空间分类

对于在启用多空间插件之前已存在的数据，可通过以下步骤实现空间归类：

#### 1. 添加空间字段

为旧表手动添加空间字段：

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. 分配用户到未分配空间

将管理老数据的用户关联至所有空间，需包含 **未分配空间（Unassigned Space）** 以便查看尚未归属到空间的数据：

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. 切换查看所有空间数据

在顶部点选查看所有空间的数据：

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. 配置老数据分配页面

新建一个页面用于老数据分配，在 **列表页** 和 **编辑页** 中显示「空间字段」，以便手动调整归属空间。

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

调整空间字段为可编辑

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. 手动分配数据空间

通过上述页面，手动编辑数据，逐步为老数据分配正确的空间（也可自行配置批量编辑）。

