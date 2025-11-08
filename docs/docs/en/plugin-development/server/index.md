# Overview

NocoBase server-side plugin development provides various functionalities and capabilities to help developers customize and extend NocoBase's core features. The following are the main capabilities and related chapters of NocoBase server-side plugin development:

| Module                      | Description                                      | Related Chapter                              |
| --------------------------- | ------------------------------------------------ | -------------------------------------------- |
| **Plugin Class**            | Create and manage server-side plugins, extend core functionality | [plugin.md](plugin.md)                       |
| **Database Operations**     | Provides interfaces for database operations, supporting CRUD and transaction management | [database.md](database.md)                    |
| **Custom Collections**      | Customize collection structures based on business needs for flexible data model management | [collections.md](collections.md)              |
| **Plugin Upgrade Data Compatibility** | Ensures plugin upgrades do not affect existing data by performing data migration and compatibility handling | [migration.md](migration.md)                  |
| **External Data Source Management** | Integrate and manage external data sources to enable data interaction | [data-source-manager.md](data-source-manager.md) |
| **Custom APIs**             | Extend API resource management by writing custom interfaces | [resource-manager.md](resource-manager.md)    |
| **API Permission Management** | Customize API permissions for fine-grained access control | [acl.md](acl.md)                              |
| **Request/Response Interception and Filtering** | Add request and response interceptors or middleware to handle tasks like logging, authentication, etc. | [context.md](context.md) and [middleware.md](middleware.md) |
| **Event Listening**         | Listen to system events (e.g., from the application or database) and trigger corresponding handlers | [event.md](event.md)                          |
| **Cache Management**        | Manage the cache to improve application performance and response speed | [cache.md](cache.md)                          |
| **Scheduled Tasks**         | Create and manage scheduled tasks, such as periodic cleanup, data synchronization, etc. | [cron-job-manager.md](cron-job-manager.md)    |
| **Multi-language Support**  | Integrate multi-language support to implement internationalization and localization | [i18n.md](i18n.md)                            |
| **Log Output**              | Customize log formats and output methods to enhance debugging and monitoring capabilities | [logger.md](logger.md)                        |
| **Custom Commands**         | Extend the NocoBase CLI by adding custom commands | [command.md](command.md)                      |
| **Writing Test Cases**      | Write and run test cases to ensure plugin stability and functional accuracy | [test.md](test.md)                            |

