# 工作流 Webhook 集成

通过 Webhook 触发器,NocoBase 可以接收来自第三方系统的 HTTP 调用并自动触发工作流,实现与外部系统的无缝集成。

## 概述

Webhook 是一种"反向 API"机制,允许外部系统在特定事件发生时主动向 NocoBase 发送数据。相比于主动轮询,Webhook 提供了更实时、更高效的集成方式。

## 典型应用场景

### 表单数据提交

外部问卷调查系统、报名表单、客户反馈表单等在用户提交数据后,通过 Webhook 将数据推送到 NocoBase,自动创建记录、触发后续处理流程(如发送确认邮件、分配任务等)。

### 消息通知

第三方消息平台(如企业微信、钉钉、Slack)的事件(如新消息、@提醒、审批完成)可以通过 Webhook 触发 NocoBase 中的自动化处理流程。

### 数据同步

当外部系统(如 CRM、ERP)的数据发生变化时,通过 Webhook 实时推送到 NocoBase,保持数据同步。

### 第三方服务集成

- **GitHub**: 代码推送、PR 创建等事件触发自动化流程
- **GitLab**: CI/CD 流程状态通知
- **表单提交**: 外部表单系统提交数据到 NocoBase
- **物联网设备**: 设备状态变化、传感器数据上报

## 功能特点

### 灵活的触发机制

- 支持 GET、POST、PUT、DELETE 等 HTTP 方法
- 自动解析 JSON、表单数据等常见格式
- 可配置请求验证,确保来源可信

### 数据处理能力

- 接收的数据可在工作流中作为变量使用
- 支持复杂的数据转换和处理逻辑
- 可与其他工作流节点组合实现复杂业务逻辑

### 安全性保障

- 支持签名验证,防止伪造请求
- 可配置 IP 白名单
- HTTPS 加密传输

## 使用步骤

### 1. 安装插件

在插件管理器中找到并安装 **[工作流：Webhook 触发器](/plugins/@nocobase/plugin-workflow-webhook/)** 插件。

> 注意: 此插件为商业插件,需要单独购买或订阅。

### 2. 创建 Webhook 工作流

1. 进入**工作流管理**页面
2. 点击**创建工作流**
3. 选择**Webhook 触发器**作为触发方式

![创建 Webhook 工作流](https://static-docs.nocobase.com/20241210105049.png)

4. 配置 Webhook 参数

![Webhook 触发器配置](https://static-docs.nocobase.com/20241210105441.png)
   - **请求路径**: 自定义 Webhook URL 路径
   - **请求方法**: 选择允许的 HTTP 方法(GET/POST/PUT/DELETE)
   - **同步/异步**: 选择是否等待工作流执行完成后返回结果
   - **验证方式**: 配置签名验证或其他安全机制

### 3. 配置工作流节点

根据业务需求添加工作流节点,例如:

- **数据表操作**: 创建、更新、删除数据
- **条件判断**: 根据接收的数据进行条件分支
- **HTTP 请求**: 调用其他 API
- **消息通知**: 发送邮件、短信等
- **自定义代码**: 执行 JavaScript 代码

### 4. 获取 Webhook URL

工作流创建后,系统会生成唯一的 Webhook URL,格式通常为:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. 在第三方系统中配置

将生成的 Webhook URL 配置到第三方系统中:

- 在表单系统设置数据提交回调地址
- 在 GitHub/GitLab 配置 Webhook
- 在企业微信/钉钉配置事件推送地址

### 6. 测试 Webhook

使用工具(如 Postman、cURL)测试 Webhook:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## 请求数据访问

在工作流中,可以通过变量访问 Webhook 接收的数据:

- `{{$context.data}}`: 请求体数据
- `{{$context.headers}}`: 请求头信息
- `{{$context.query}}`: URL 查询参数
- `{{$context.params}}`: 路径参数

![请求参数解析](https://static-docs.nocobase.com/20241210111155.png)

![请求体解析](https://static-docs.nocobase.com/20241210112529.png)

## 响应配置

![响应设置](https://static-docs.nocobase.com/20241210114312.png)

### 同步模式

工作流执行完成后返回结果,可配置:

- **响应状态码**: 200、201 等
- **响应数据**: 自定义返回的 JSON 数据
- **响应头**: 自定义 HTTP 头

### 异步模式

立即返回确认响应,工作流在后台执行,适用于:

- 长时间运行的工作流
- 不需要返回执行结果的场景
- 高并发场景

## 安全最佳实践

### 1. 启用签名验证

大多数第三方服务都支持签名机制:

```javascript
// 示例: 验证 GitHub Webhook 签名
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. 使用 HTTPS

确保 NocoBase 部署在 HTTPS 环境下,保护数据传输安全。

### 3. 限制请求来源

配置 IP 白名单,只允许可信来源的请求。

### 4. 数据验证

在工作流中添加数据验证逻辑,确保接收的数据格式正确、内容合法。

### 5. 日志审计

记录所有 Webhook 请求,便于追踪和排查问题。

## 常见问题

### Webhook 没有触发?

1. 检查 Webhook URL 是否正确
2. 确认工作流状态为"已启用"
3. 查看第三方系统的发送日志
4. 检查防火墙和网络配置

### 如何调试 Webhook?

1. 查看工作流执行记录了解请求和调用结果的详细信息
2. 使用 Webhook 测试工具(如 Webhook.site)验证请求
3. 在执行记录中检查关键数据和错误信息

### 如何处理重试?

某些第三方服务在未收到成功响应时会重试发送:

- 确保工作流具有幂等性
- 使用唯一标识符去重
- 记录已处理的请求 ID

### 性能优化建议

- 使用异步模式处理耗时操作
- 添加条件判断,过滤不需要处理的请求
- 考虑使用消息队列处理高并发场景

## 示例场景

### 外部表单提交处理

```javascript
// 1. 验证数据来源
// 2. 解析表单数据
const formData = context.data;

// 3. 创建客户记录
// 4. 分配给相关负责人
// 5. 发送确认邮件给提交者
if (formData.email) {
  // 发送邮件通知
}
```

### GitHub 代码推送通知

```javascript
// 1. 解析推送数据
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. 如果是主分支
if (branch === 'main') {
  // 3. 触发部署流程
  // 4. 通知团队成员
}
```

![Webhook 工作流示例](https://static-docs.nocobase.com/20241210120655.png)

## 相关资源

- [工作流插件文档](/plugins/@nocobase/plugin-workflow/)
- [工作流：Webhook 触发器](/workflow/triggers/webhook)
- [工作流：HTTP 请求节点](/integration/workflow-http-request/)
- [API 密钥认证](/integration/api-keys/)
