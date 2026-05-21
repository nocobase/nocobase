---
title: "Server-side Plugin Development Overview"
description: "NocoBase server-side plugin development: Plugin class, app, db, resources, ACL, database, migration, middleware, events, CLI."
keywords: "Server Plugin,Plugin class,app,db,ACL,migration,NocoBase"
---

# Overview

NocoBase server-side plugins can do many things: define data tables, write custom APIs, manage permissions, listen to events, register scheduled tasks, and even extend CLI commands. All these capabilities are organized through a unified Plugin class.

| I want to...                                        | Where to look                                           |
| --------------------------------------------------- | ------------------------------------------------------- |
| Understand the plugin class lifecycle and `app` members | [Plugin](./plugin.md)                                   |
| Perform CRUD and transaction management on the database | [Database](./database.md)                               |
| Define or extend data tables with code              | [Collections](./collections.md)                         |
| Migrate data during plugin upgrades                 | [Migration](./migration.md)                             |
| Manage multiple data sources                        | [DataSourceManager](./data-source-manager.md)           |
| Register custom APIs and resource operations        | [ResourceManager](./resource-manager.md)                |
| Configure API permissions                           | [ACL](./acl.md)                                         |
| Add request/response interceptors or middleware     | [Context](./context.md) and [Middleware](./middleware.md) |
| Listen to application or database events            | [Event](./event.md)                                     |
| Use cache to improve performance                    | [Cache](./cache.md)                                     |
| Register scheduled tasks                            | [CronJobManager](./cron-job-manager.md)                 |
| Support multiple languages                          | [I18n](./i18n.md)                                       |
| Customize log output                                | [Logger](./logger.md)                                   |
| Extend CLI commands                                 | [Command](./command.md)                                 |
| Write test cases                                    | [Test](./test.md)                                       |

## Related Links

- [Plugin](./plugin.md) - Plugin class lifecycle, member methods, and the `app` object
- [Collections](./collections.md) - Define or extend data table structures with code
- [Database](./database.md) - CRUD, Repository, transactions, and database events
- [ResourceManager](./resource-manager.md) - Register custom APIs and resource operations
- [ACL](./acl.md) - Role permissions, permission snippets, and access control
- [Plugin Development Overview](../index.md) - Overall introduction to plugin development
- [Write Your First Plugin](../write-your-first-plugin.md) - Create a complete plugin from scratch
