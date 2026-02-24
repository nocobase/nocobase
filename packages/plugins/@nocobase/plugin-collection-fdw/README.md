# Foreign Data Wrapper Collection

基于数据库的 foreign data wrapper 实现的连接远程数据表的功能插件。

## 介绍

在 MySQL 和 PostgreSQL 中，都提供了通过 foreign data wrapper 连接外部数据的能力，本插件整合了这些能力，使得可以在 NocoBase 系统中，连接远程数据表，实现数据的同步和共享。


## 使用前提

已支持的远程数据类型根据数据库类型不同而不同，目前支持情况如下：

### MySQL

MySQL 通过 `federated` 引擎， 支持连接远程 MySQL 及其协议兼容数据库，如 MariaDB。在使用前需要开启 `federated` 引擎支持，可参照文档 [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html)。

### PostgreSQL 

在 PostgreSQL 中，可通过不同类型的 `fdw` 扩展来支持不同的远程数据类型，目前支持的扩展有：

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html)：在 PostgreSQL 中连接远程 PostgreSQL 数据库。
- [mysql_fdw(开发中)](https://github.com/EnterpriseDB/mysql_fdw)：在 PostgreSQL 中连接远程 MySQL 数据库。
- 其余类型的 fdw 扩展，可参考 [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers)，接入 NocoBase 需要在代码中实现相应的适配接口。

在 NocoBase 中使用前需要确保数据库系统已支持以上插件的开启。

## 使用

1. 开启插件之后，在「数据表管理->创建数据表」 下拉中，选择「连接外部数据」。
2. 填写本地数据表的名称。
3. 在「数据库服务」下拉选项中，选择已存在的数据库服务，或者选择「创建数据库服务」填写数据库连接信息，创建一个新的数据库服务。
4. 在「远程表」的下拉选项中，选择需要连接的数据表。
5. 在字段列表中，手动配置字段的 interface 信息。
6. 点击「创建」按钮，完成数据表的创建。

在数据表创建完成之后， 可以在前端区块中使用该数据表。
