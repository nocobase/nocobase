# 集成

## 概述

NocoBase 提供全面的集成能力,允许与外部系统、第三方服务和各种数据源无缝连接。通过灵活的集成方式,您可以扩展 NocoBase 的功能以满足多样化的业务需求。

## 集成方式

### API 集成

NocoBase 提供强大的 API 能力,用于与外部应用程序和服务集成:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[API 密钥](/integration/api-keys/)**: 使用 API 密钥进行安全认证,以编程方式访问 NocoBase 资源
- **[API 文档](/integration/api-doc/)**: 内置 API 文档,用于探索和测试端点

### 单点登录 (SSO)

与企业身份系统集成,实现统一认证:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[SSO 集成](/integration/sso/)**: 支持 SAML、OIDC、CAS、LDAP 和第三方平台认证
- 集中化用户管理和访问控制
- 跨系统的无缝认证体验

### 工作流集成

将 NocoBase 工作流与外部系统连接:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[工作流 Webhook](/integration/workflow-webhook/)**: 接收来自外部系统的事件以触发工作流
- **[工作流 HTTP 请求](/integration/workflow-http-request/)**: 从工作流向外部 API 发送 HTTP 请求
- 跨平台自动化业务流程

### 外部数据源

连接到外部数据库和数据系统:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[外部数据库](/data-sources/)**: 直接连接 MySQL、PostgreSQL、MariaDB、MSSQL、Oracle 和 KingbaseES 数据库
- 识别外部数据库表结构,在 NocoBase 中直接对外部数据进行增删改查操作
- 统一的数据管理界面

### 嵌入式内容

在 NocoBase 中嵌入外部内容:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Iframe 区块](/integration/block-iframe/)**: 嵌入外部网页和应用程序
- **JS 区块**: 执行自定义 JavaScript 代码以实现高级集成

## 常见集成场景

### 企业系统集成

- 将 NocoBase 与 ERP、CRM 或其他企业系统连接
- 双向数据同步
- 自动化跨系统工作流

### 第三方服务集成

- 查询支付网关的支付状态、集成消息服务或云平台
- 利用外部 API 扩展功能
- 使用 webhook 和 HTTP 请求构建自定义集成

### 数据集成

- 连接到多个数据源
- 聚合来自不同系统的数据
- 创建统一的仪表板和报表

## 安全注意事项

在将 NocoBase 与外部系统集成时,请考虑以下安全最佳实践:

1. **使用 HTTPS**: 始终使用加密连接进行数据传输
2. **保护 API 密钥**: 安全存储 API 密钥并定期轮换
3. **最小权限原则**: 仅授予集成所需的必要权限
4. **审计日志**: 监控和记录集成活动
5. **数据验证**: 验证来自外部源的所有数据
