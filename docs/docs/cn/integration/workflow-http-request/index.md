# 工作流 HTTP 请求集成

通过 HTTP 请求节点,NocoBase 工作流可以主动向任意 HTTP 服务发送请求,实现与外部系统的数据交互和业务集成。

## 概述

HTTP 请求节点是工作流中的核心集成组件,允许您在工作流执行过程中调用第三方 API、内部服务接口或其他 Web 服务,获取数据或触发外部操作。

## 典型应用场景

### 数据获取

- **第三方数据查询**: 从天气 API、汇率 API 等获取实时数据
- **地址解析**: 调用地图服务 API 进行地址解析和地理编码
- **企业数据同步**: 从 CRM、ERP 系统获取客户、订单等数据

### 业务触发

- **消息推送**: 调用短信、邮件、企业微信等服务发送通知
- **支付请求**: 向支付网关发起支付、退款等操作
- **订单处理**: 向物流系统提交运单、查询物流状态

### 系统集成

- **微服务调用**: 在微服务架构中调用其他服务的 API
- **数据上报**: 向数据分析平台、监控系统上报业务数据
- **第三方服务**: 集成 AI 服务、OCR 识别、语音合成等

### 自动化操作

- **定时任务**: 定期调用外部 API 同步数据
- **事件响应**: 当数据变化时自动调用外部 API 通知相关系统
- **审批流程**: 调用审批系统 API 提交审批请求

## 功能特点

### 完整的 HTTP 支持

- 支持 GET、POST、PUT、PATCH、DELETE 等所有 HTTP 方法
- 支持自定义请求头(Headers)
- 支持多种数据格式: JSON、表单数据、XML 等
- 支持 URL 参数、路径参数、请求体等多种传参方式

### 灵活的数据处理

- **变量引用**: 使用工作流变量动态构造请求
- **响应解析**: 自动解析 JSON 响应,提取所需数据
- **数据转换**: 对请求数据和响应数据进行格式转换
- **错误处理**: 配置重试策略、超时设置、错误处理逻辑

### 安全认证

- **Basic Auth**: HTTP 基本认证
- **Bearer Token**: 令牌认证
- **API Key**: 自定义 API 密钥认证
- **自定义 Headers**: 支持任意认证方式

## 使用步骤

### 1. 确认插件已启用

HTTP 请求节点是工作流插件的内置功能,确保 **[工作流](/plugins/@nocobase/plugin-workflow/)** 插件已启用。

### 2. 在工作流中添加 HTTP 请求节点

1. 创建或编辑工作流
2. 在需要的位置添加 **HTTP 请求** 节点

![HTTP 请求_添加](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. 配置请求参数

### 3. 配置请求参数

![HTTP请求节点_节点配置](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### 基本配置

- **请求 URL**: 目标 API 地址,支持使用变量
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **请求方法**: 选择 GET、POST、PUT、DELETE 等

- **请求头**: 配置 HTTP Headers
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **请求参数**:
  - **Query 参数**: URL 查询参数
  - **Body 参数**: 请求体数据(POST/PUT)

#### 高级配置

- **超时时间**: 设置请求超时(默认 30 秒)
- **失败重试**: 配置重试次数和重试间隔
- **忽略失败**: 即使请求失败,工作流继续执行
- **代理设置**: 配置 HTTP 代理(如需要)

### 4. 使用响应数据

HTTP 请求节点执行后,响应数据可以在后续节点中使用:

- `{{$node.data.status}}`: HTTP 状态码
- `{{$node.data.headers}}`: 响应头
- `{{$node.data.data}}`: 响应体数据
- `{{$node.data.error}}`: 错误信息(如果请求失败)

![HTTP请求节点_响应结果使用](https://static-docs.nocobase.com/20240529110610.png)

## 示例场景

### 示例 1: 获取天气信息

```javascript
// 配置
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// 使用响应
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### 示例 2: 发送企业微信消息

```javascript
// 配置
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "订单 {{$context.orderId}} 已发货"
  }
}
```

### 示例 3: 查询支付状态

```javascript
// 配置
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// 条件判断
如果 {{$node.data.data.status}} 等于 "paid"
  - 更新订单状态为"已支付"
  - 发送支付成功通知
否则如果 {{$node.data.data.status}} 等于 "pending"
  - 保持订单状态为"待支付"
否则
  - 记录支付失败日志
  - 通知管理员处理异常
```

### 示例 4: 数据同步到 CRM

```javascript
// 配置
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## 认证方式配置

### Basic Authentication

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Bearer Token

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### API Key

```javascript
// 在 Header 中
Headers:
  X-API-Key: your-api-key

// 或在 Query 中
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

需要先获取 access_token,然后使用:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## 错误处理和调试

### 常见错误

1. **连接超时**: 检查网络连接、增加超时时间
2. **401 未授权**: 检查认证信息是否正确
3. **404 未找到**: 检查 URL 是否正确
4. **500 服务器错误**: 查看 API 提供方的服务状态

### 调试技巧

1. **使用日志节点**: 在 HTTP 请求前后添加日志节点,记录请求和响应数据

2. **查看执行日志**: 工作流执行日志中包含详细的请求和响应信息

3. **测试工具**: 使用 Postman、cURL 等工具先测试 API

4. **错误处理**: 添加条件判断处理不同的响应状态

```javascript
如果 {{$node.data.status}} >= 200 且 {{$node.data.status}} < 300
  - 处理成功逻辑
否则
  - 处理失败逻辑
  - 记录错误: {{$node.data.error}}
```

## 性能优化建议

### 1. 使用异步处理

对于不需要立即获取结果的请求,考虑使用异步工作流。

### 2. 配置合理的超时

根据 API 的实际响应时间设置超时,避免过长等待。

### 3. 实施缓存策略

对于不经常变化的数据(如配置、字典),考虑缓存响应结果。

### 4. 批量处理

如果需要多次调用同一 API,考虑使用 API 的批量接口(如支持)。

### 5. 错误重试

配置合理的重试策略,但避免过度重试导致 API 限流。

## 安全最佳实践

### 1. 保护敏感信息

- 不要在 URL 中暴露敏感信息
- 使用 HTTPS 加密传输
- API 密钥等敏感信息使用环境变量或配置管理

### 2. 验证响应数据

```javascript
// 验证响应状态
if (![200, 201].includes($node.data.status)) {
  throw new Error('API request failed');
}

// 验证数据格式
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Invalid response data');
}
```

### 3. 限制请求频率

遵守第三方 API 的速率限制,避免被封禁。

### 4. 日志脱敏

记录日志时,注意脱敏处理敏感信息(密码、密钥等)。

## 与 Webhook 的对比

| 特性 | HTTP 请求节点 | Webhook 触发器 |
|------|-------------|---------------|
| 方向 | NocoBase 主动调用外部 | 外部主动调用 NocoBase |
| 时机 | 工作流执行时 | 外部事件发生时 |
| 用途 | 获取数据、触发外部操作 | 接收外部通知、事件 |
| 典型场景 | 调用支付接口、查询天气 | 支付回调、消息通知 |

这两个功能互补,共同构建完整的系统集成方案。

## 相关资源

- [工作流插件文档](/plugins/@nocobase/plugin-workflow/)
- [工作流：HTTP 请求节点](/workflow/nodes/request)
- [工作流：Webhook 触发器](/integration/workflow-webhook/)
- [API 密钥认证](/integration/api-keys/)
- [API 文档插件](/plugins/@nocobase/plugin-api-doc/)
