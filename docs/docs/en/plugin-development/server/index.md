# Overview

NocoBase server-side plugin development provides various functionalities and capabilities to help developers customize and extend NocoBase's core features. The following are the main capabilities and related chapters of NocoBase server-side plugin development:

| Module                      | Description                                      | Related Chapter                              |
| --------------------------- | ------------------------------------------------ | -------------------------------------------- |
| **Plugin Class**            | Create and manage server-side plugins, extend core functionality | [plugin.md](plugin.md)                       |
| **Database Operations**     | Provide database operation interfaces, support CRUD operations and transaction management | [database.md](database.md)                    |
| **Custom Data Tables**      | Customize database table structures based on business needs, flexibly manage data models | [collections.md](collections.md)              |
| **Plugin Upgrade Data Compatibility** | Ensure plugin upgrades don't affect existing data, perform data migration and compatibility handling | [migration.md](migration.md)                  |
| **External Data Source Management** | Integrate and manage external data sources, implement data interaction | [data-source-manager.md](data-source-manager.md) |
| **Custom APIs**             | Extend API resource management, write custom interfaces | [resource-manager.md](resource-manager.md)    |
| **API Permission Management** | Customize API permissions, perform fine-grained permission control | [acl.md](acl.md)                              |
| **Request/Response Interception and Filtering** | Add request and response interceptors or middleware, handle logs, authentication, etc. | [context.md](context.md) and [middleware.md](middleware.md) |
| **Event Listening**         | Listen to application, database, and other system events, respond to event handling | [event.md](event.md)                          |
| **Cache Management**        | Manage cache to improve application performance and response speed | [cache.md](cache.md)                          |
| **Scheduled Tasks**         | Create and manage scheduled tasks, such as periodic cleanup, data synchronization, etc. | [cron-job-manager.md](cron-job-manager.md)    |
| **Multi-language Support**  | Integrate multi-language support, implement internationalization and localization | [i18n.md](i18n.md)                            |
| **Log Output**              | Customize log formats and output methods, enhance debugging and monitoring capabilities | [logger.md](logger.md)                        |
| **Custom Commands**         | Extend NocoBase CLI, add custom commands | [command.md](command.md)                      |
| **Writing Test Cases**      | Write and run test cases, ensure plugin stability and functional accuracy | [test.md](test.md)                            |

