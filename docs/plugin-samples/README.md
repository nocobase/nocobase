# NocoBase 插件示例

NocoBase 提供了丰富的插件示例，帮助开发者快速理解和掌握插件开发的各种场景和技巧。

## 目录结构

```
docs/plugin-samples/
├── README.md                    # 插件示例主文档
├── first-plugin.md             # 第一个插件示例
├── tables-fields.md            # 表和字段示例
├── resources-actions.md        # 资源和操作示例
├── database-usage.md           # 数据库使用示例
├── custom-commands.md          # 自定义命令行示例
├── caching.md                  # 缓存示例
├── middleware.md               # 服务器中间件示例
├── ui-components.md            # UI 组件示例
├── workflow-nodes.md           # 工作流节点示例
├── plugin-settings.md          # 插件设置示例
├── custom-fields.md            # 自定义字段示例
├── file-management.md          # 文件管理示例
├── authentication.md           # 认证示例
├── api-documentation.md        # API 文档示例
├── data-visualization.md       # 数据可视化示例
├── calendar.md                 # 日历示例
├── gantt.md                    # 甘特图示例
├── kanban.md                   # 看板示例
├── china-region.md             # 中国行政区划字段示例
├── formula-field.md            # 公式字段示例
├── workflow.md                 # 工作流示例
├── auth.md                     # 认证示例
├── file-manager.md             # 文件管理器示例
├── acl.md                      # 权限控制示例
├── api-keys.md                 # API 密钥示例
├── sdk-integration.md          # SDK 集成示例
└── sdk-advanced.md             # SDK 高级使用示例
```

## 示例类别

### 1. [第一个插件](./first-plugin.md)
从零开始创建一个简单的插件，了解插件的基本结构和开发流程。

### 2. [表和字段](./tables-fields.md)
展示如何定义数据表结构和字段类型，包括各种关系字段的使用。

### 3. [资源和操作](./resources-actions.md)
演示如何创建自定义资源和操作，扩展 RESTful API。

### 4. [数据库使用](./database-usage.md)
介绍数据库操作的最佳实践，包括查询、更新和事务处理。

### 5. [自定义命令行](./custom-commands.md)
展示如何创建自定义命令行工具和迁移脚本。

### 6. [缓存](./caching.md)
演示如何在插件中使用缓存提高性能。

### 7. [服务器中间件](./middleware.md)
介绍如何创建和使用服务器中间件。

### 8. [UI 组件](./ui-components.md)
展示如何开发自定义 UI 组件和页面。

### 9. [工作流节点](./workflow-nodes.md)
演示如何创建自定义工作流节点。

### 10. [插件设置](./plugin-settings.md)
介绍如何为插件添加设置页面和配置选项。

### 11. [自定义字段](./custom-fields.md)
展示如何创建自定义字段类型以满足特定业务需求。

### 12. [文件管理](./file-management.md)
介绍如何处理文件上传、存储、权限控制和版本管理。

### 13. [认证](./authentication.md)
展示如何实现自定义认证机制，包括OAuth2、JWT和多因素认证。

### 14. [API 文档](./api-documentation.md)
介绍如何生成和自定义 API 文档，包括 OpenAPI 规范和文档安全。

### 15. [数据可视化](./data-visualization.md)
展示如何使用数据可视化插件创建图表和仪表板。

### 16. [日历](./calendar.md)
介绍如何使用日历插件管理日期相关数据。

### 17. [甘特图](./gantt.md)
演示如何使用甘特图插件进行项目管理。

### 18. [看板](./kanban.md)
展示如何使用看板插件进行任务管理。

### 19. [中国行政区划字段](./china-region.md)
介绍如何使用中国行政区划字段处理地区信息。

### 20. [公式字段](./formula-field.md)
演示如何使用公式字段进行数据计算。

### 21. [工作流](./workflow.md)
展示如何使用工作流插件实现业务自动化。

### 22. [认证](./auth.md)
介绍如何使用认证插件管理用户认证。

### 23. [文件管理器](./file-manager.md)
演示如何使用文件管理器插件处理文件存储和访问。

### 24. [权限控制](./acl.md)
展示如何使用权限控制插件管理访问控制。

### 25. [API 密钥](./api-keys.md)
介绍如何使用 API 密钥插件进行程序化访问。

### 26. [SDK 集成](./sdk-integration.md)
展示如何在插件中集成和使用 NocoBase SDK。

### 27. [SDK 高级使用](./sdk-advanced.md)
介绍 NocoBase SDK 的高级功能和最佳实践。

## 学习建议

建议按照以下顺序学习插件示例：

1. 从 [第一个插件](./first-plugin.md) 开始，了解插件开发基础
2. 学习 [表和字段](./tables-fields.md) 和 [资源和操作](./resources-actions.md)
3. 掌握 [数据库使用](./database-usage.md) 和 [UI 组件](./ui-components.md)
4. 根据需要学习其他高级示例

## 贡献示例

欢迎贡献更多的插件示例：

1. 确保示例代码清晰易懂
2. 提供详细的文档说明
3. 遵循 NocoBase 插件开发规范
4. 包含必要的测试用例