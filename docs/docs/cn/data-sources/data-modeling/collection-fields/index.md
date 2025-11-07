# 数据表字段

## 字段的 Interface 类型

NocoBase 从 Interface 视角将字段分为了以下几类：

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## 字段数据类型

每个 Field Interface 都有一个默认的数据类型，例如 Interface 为数字（Number）的字段，数据类型默认是 double，但也可以是 float、decimal 等。目前支持的数据类型有：

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## 字段类型映射

主数据库新增字段的流程为：

1. 选择 Interface 类型
2. 配置当前 Interface 可选数据类型

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

外部数据源的字段映射流程为：

1. 自动根据外部数据库的字段类型，映射相对应的数据类型（Field type）和 UI 类型（Field Interface）。
2. 按需修改为更合适的数据类型和 Interface 类型

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)