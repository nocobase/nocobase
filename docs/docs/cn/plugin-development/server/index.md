# 概述

NocoBase 服务端插件开发提供了多种功能和能力，帮助开发者定制和扩展 NocoBase 的核心功能。以下是 NocoBase 服务端插件开发的主要能力和相关章节：

| 功能模块                  | 说明                                           | 相关章节                                      |
|---------------------------|------------------------------------------------|-----------------------------------------------|
| **插件类**               | 创建和管理服务端插件，扩展核心功能             | [plugin.md](plugin.md)                       |
| **数据库操作**             | 提供对数据库的操作接口，支持 CRUD 操作及事务管理 | [database.md](database.md)                    |
| **自定义数据表**           | 根据业务需求自定义数据库表结构，灵活管理数据模型 | [collections.md](collections.md)              |
| **插件升级数据兼容性处理** | 确保插件升级时不影响现有数据，进行数据迁移和兼容性处理 | [migration.md](migration.md)                  |
| **外部数据源管理**         | 集成和管理外部数据源，实现数据交互             | [data-source-manager.md](data-source-manager.md) |
| **自定义接口**             | 扩展 API 资源管理，编写自定义接口               | [resource-manager.md](resource-manager.md)    |
| **接口权限管理**           | 自定义接口权限，进行精细化权限控制             | [acl.md](acl.md)                              |
| **接口请求响应拦截与过滤** | 添加请求和响应的拦截器或中间件，处理日志、认证等 | [context.md](context.md) 和 [middleware.md](middleware.md) |
| **事件监听**               | 监听应用、数据库等系统事件，响应事件处理       | [event.md](event.md)                          |
| **缓存管理**               | 管理缓存，提高应用性能和响应速度               | [cache.md](cache.md)                          |
| **定时任务**               | 创建和管理定时任务，如定期清理、数据同步等     | [cron-job-manager.md](cron-job-manager.md)    |
| **多语言支持**             | 集成多语言支持，实现国际化和本地化             | [i18n.md](i18n.md)                            |
| **日志输出**               | 自定义日志格式和输出方式，提升调试和监控能力   | [logger.md](logger.md)                        |
| **自定义命令**             | 扩展 NocoBase CLI，添加自定义命令               | [command.md](command.md)                      |
| **编写测试用例**           | 编写和运行测试用例，保证插件稳定性和功能准确性 | [test.md](test.md)                            |
