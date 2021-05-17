---
title: '@nocobase/migrator'
order: 8
# toc: menu
---

# @nocobase/migrator <Badge>未实现</Badge>

NocoBase 的 Database 是基于 Sequelize，Sequelize 虽然提供了 sequelize-cli，包括 migrations 和 seeders 但是并不适用于 NocoBase。

- Sequelize 的 migration 只有 queryInterface，但是 NocoBase 考虑的更多是配置层面问题
- 要考虑 Upgrade 层面的问题，比如 0.3 升级 0.6、0.4 升级 0.6、0.5 升级 0.6 等等一系列问题
- 需要考虑插件里的 migrations

目前已知的开源项目里，Ghost 团队实现的 [knex-migrator](https://github.com/TryGhost/knex-migrator) 非常接近我们的需求。Ghost 的 [migrations](https://github.com/TryGhost/Ghost/tree/v4.2.2/core/server/data/migrations) 例子。

虽然非常接近，但也存在一些差异：

- NocoBase 的 database 用的是 Sequelize 而不是 Knex
- NocoBase 的配置更复杂，我们要为此提供一些简易的 API 辅助完成 migrate
