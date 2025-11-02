# Overview

NocoBase server-side plugin development provides a variety of features and capabilities to help developers customize and extend the core functions of NocoBase. The following are the main capabilities of NocoBase server-side plugin development and their related chapters:

| Feature Module                               | Description                                                                                             | Related Chapters                                      |
|----------------------------------------------|---------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| **Plugin Class**                             | Create and manage server-side plugins to extend core functionality.                                     | [plugin.md](plugin.md)                                |
| **Database Operations**                      | Provides interfaces for database operations, supporting CRUD operations and transaction management.     | [database.md](database.md)                            |
| **Custom Collections**                       | Customize collection structures based on business needs to flexibly manage data models.                 | [collections.md](collections.md)                      |
| **Handling Data Compatibility for Plugin Upgrades** | Ensure that plugin upgrades do not affect existing data by performing data migration and compatibility handling. | [migration.md](migration.md)                          |
| **External Data Source Management**          | Integrate and manage external data sources to enable data interaction.                                  | [data-source-manager.md](data-source-manager.md)      |
| **Custom APIs**                              | Extend API resource management and write custom APIs.                                                   | [resource-manager.md](resource-manager.md)            |
| **API Permission Management**                | Customize API permissions for fine-grained access control.                                              | [acl.md](acl.md)                                      |
| **API Request/Response Interception and Filtering** | Add interceptors or middleware for requests and responses to handle logging, authentication, etc. | [context.md](context.md) and [middleware.md](middleware.md) |
| **Event Listening**                          | Listen for system events such as application and database events, and handle them accordingly.          | [event.md](event.md)                                  |
| **Cache Management**                         | Manage cache to improve application performance and response speed.                                     | [cache.md](cache.md)                                  |
| **Scheduled Tasks**                          | Create and manage scheduled tasks, such as periodic cleanup and data synchronization.                   | [cron-job-manager.md](cron-job-manager.md)            |
| **Multi-language Support**                   | Integrate multi-language support to achieve internationalization and localization.                      | [i18n.md](i18n.md)                                    |
| **Logging**                                  | Customize log formats and output methods to enhance debugging and monitoring capabilities.              | [logger.md](logger.md)                                |
| **Custom Commands**                          | Extend the NocoBase CLI by adding custom commands.                                                      | [command.md](command.md)                              |
| **Writing Test Cases**                       | Write and run test cases to ensure plugin stability and functional accuracy.                            | [test.md](test.md)                                    |