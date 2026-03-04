# 基于 Java 的 Action 注册机制设计 V2（融合版）

## 1. 架构概述

### 1.1 设计理念

借鉴 NocoBase 的微内核 + 插件化思想，结合云原生控制面/数据面分离架构，设计一套面向企业级微服务的 Java Action 机制。

### 1.2 控制面/数据面分离架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🎛️ Control Plane (控制面)                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Action Registry Service (注册中心服务)                   │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  Metadata    │  │   Lifecycle  │  │   Version    │              │   │
│  │  │   Store      │  │   Manager    │  │   Manager    │              │   │
│  │  │  (Database)  │  │              │  │   (SemVer)   │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   Schema     │  │   Multi-     │  │   Audit &    │              │   │
│  │  │  Validator   │  │   Tenant     │  │   Analytics  │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  API:                                                                       │
│  - POST   /api/v1/registry/actions              # 注册 Action             │
│  - PUT    /api/v1/registry/actions/{key}        # 更新 Action             │
│  - POST   /api/v1/registry/actions/{key}/activate   # 激活               │
│  - POST   /api/v1/registry/actions/{key}/deprecate  # 弃用               │
│  - GET    /api/v1/registry/actions/{key}        # 查询元数据              │
│  - GET    /api/v1/registry/actions?namespace=xx # 搜索                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
┌─────────────────┐         ┌─────────────────┐    ┌─────────────────┐
│   Register      │         │   Register      │    │   Register      │
│   Local Actions │         │   Local Actions │    │   Local Actions │
└────────┬────────┘         └────────┬────────┘    └────────┬────────┘
         │                           │                      │
┌────────▼───────────────────────────▼──────────────────────▼────────┐
│                         📦 Data Plane (数据面)                     │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   Service A      │  │   Service B      │  │   Service C      │  │
│  │  (user-service)  │  │  (order-service) │  │ (inventory-svc)  │  │
│  │                  │  │                  │  │                  │  │
│  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │
│  │ │ Action SDK   │ │  │ │ Action SDK   │ │  │ │ Action SDK   │ │  │
│  │ │              │ │  │ │              │ │  │ │              │ │  │
│  │ │ • Scanner    │ │  │ │ • Scanner    │ │  │ │ • Remote     │ │  │
│  │ │ • Executor   │ │  │ │ • Executor   │ │  │ │   Proxy      │ │  │
│  │ │ • Client     │ │  │ │ • Client     │ │  │ │              │ │  │
│  │ │ • Cache      │ │  │ │ • Cache      │ │  │ │              │ │  │
│  │ └──────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │  │
│  │                  │  │                  │  │                  │  │
│  │ • user:create    │  │ • order:create   │  │ • stock:check    │  │
│  │ • user:get       │  │ • order:cancel   │  │ • stock:deduct    │  │
│  │ • user:list      │  │ • order:query    │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Action Gateway (可选，统一入口)                   │  │
│  │                                                              │  │
│  │  • 路由转发  • 鉴权认证  • 限流熔断  • 审计日志  • 多租户隔离   │  │
│  │                                                              │  │
│  │  POST /api/action-invoke/{namespace}.{action}                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### 1.3 部署模式

| 模式 | 适用场景 | 架构特点 |
|------|---------|---------|
| **嵌入式模式** | 小型项目/单体应用 | 控制面作为 Library 嵌入，无需独立服务 |
| **独立模式** | 中大型微服务 | 控制面独立部署，多个业务服务共享 |
| **混合模式** | 大型企业 | 多级控制面：集团级 + 事业部级 |

---

## 2. 核心概念

### 2.1 Action 标识符（Action Key）

统一命名规范，支持版本管理：

```
{domain}.{boundedContext}.{actionName}:{version}

示例：
- crm.customer.create:1.0.0
- order.fulfillment.allocateStock:2.1.0
- payment.alipay.refund:1.5.0-beta.1
```

字段说明：
- **domain**: 领域（crm/order/payment）
- **boundedContext**: 限界上下文（customer/fulfillment/alipay）
- **actionName**: 动作名称（create/allocateStock/refund）
- **version**: 遵循 SemVer 规范

### 2.2 Action 生命周期状态

```
                    ┌─────────────┐
                    │    DRAFT    │◄──── 初始状态，开发中
                    │   (草稿)    │
                    └──────┬──────┘
                           │ 注册完成
                           ▼
                    ┌─────────────┐
         ┌─────────│    ACTIVE   │◄──── 可正常调用
         │         │   (活跃)    │
         │         └──────┬──────┘
         │                │
   重新激活              弃用
         │                ▼
         │         ┌─────────────┐
         └────────►│  DEPRECATED │◄──── 不建议新接入，但兼容调用
                   │   (已弃用)   │
                   └──────┬──────┘
                          │ 下线
                          ▼
                   ┌─────────────┐
                   │   DISABLED  │◄──── 停用，不可调用
                   │   (已停用)   │
                   └──────┬──────┘
                          │ 清理
                          ▼
                   ┌─────────────┐
                   │   REMOVED   │◄──── 逻辑删除，仅保留记录
                   │   (已移除)   │
                   └─────────────┘
```

状态转换规则：
- DRAFT → ACTIVE: 开发完成并通过校验
- ACTIVE → DEPRECATED: 标记弃用，设置迁移窗口
- ACTIVE → DISABLED: 紧急停用
- DEPRECATED → DISABLED: 迁移窗口到期
- DISABLED → ACTIVE: 重新激活
- 任意 → REMOVED: 管理员清理（仅逻辑删除）

### 2.3 Action 类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| **SYNC** | 同步请求-响应 | 常规业务操作 |
| **ASYNC** | 异步执行（MQ/事件） | 耗时操作、削峰填谷 |
| **STREAM** | 流式响应 | 大数据导出、实时推送 |

---

## 3. 标准 Metadata Schema

### 3.1 Action 元数据结构

```yaml
# 示例：创建客户 Action 的完整元数据
apiVersion: action.example.io/v1
kind: Action
metadata:
  name: create
  namespace: crm.customer
  version: 1.0.0
  title: 创建客户
  description: 创建新客户记录，包含基础信息和联系方式
  labels:
    env: prod
    team: crm
    feature: customer-management
  owner: crm-team@example.com
  createdAt: 2024-01-15T08:00:00Z
  updatedAt: 2024-01-15T08:00:00Z
spec:
  type: SYNC
  protocol: HTTP
  endpoint:
    service: crm-service
    path: /api/v1/customers
    method: POST
    timeoutMs: 5000
  
  # 输入参数 Schema (JSON Schema)
  inputSchema:
    type: object
    required: [customerName, contact]
    properties:
      customerName:
        type: string
        description: 客户名称
        minLength: 2
        maxLength: 100
      customerType:
        type: string
        enum: [ENTERPRISE, INDIVIDUAL]
        default: INDIVIDUAL
      contact:
        type: object
        required: [phone]
        properties:
          phone:
            type: string
            pattern: '^1[3-9]\d{9}$'
          email:
            type: string
            format: email
          address:
            type: string
            maxLength: 500
      tags:
        type: array
        items:
          type: string
        maxItems: 10
  
  # 输出结果 Schema
  outputSchema:
    type: object
    required: [customerId]
    properties:
      customerId:
        type: string
        description: 客户唯一标识
      customerName:
        type: string
      status:
        type: string
        enum: [ACTIVE, PENDING]
      createdAt:
        type: string
        format: date-time
  
  # 错误响应 Schema
  errorSchema:
    type: object
    properties:
      code:
        type: string
      message:
        type: string
      details:
        type: object
  
  # 重试策略
  retryPolicy:
    maxAttempts: 3
    backoffMs: 1000
    retryableCodes: [TIMEOUT, SERVICE_UNAVAILABLE]
  
  # 认证授权
  auth:
    mode: JWT
    scopes: [crm:write, customer:manage]
  
  # 幂等控制
  idempotency:
    enabled: true
    keyHeader: Idempotency-Key
    ttlSeconds: 86400
  
  # 多租户
  tenantScope: TENANT_SPECIFIC  # GLOBAL / TENANT_SPECIFIC

status:
  state: ACTIVE
  lastUpdatedAt: 2024-01-15T08:00:00Z
  usageStats:
    totalCalls: 15000
    successRate: 99.8
    avgLatencyMs: 45
```

### 3.2 JSON Schema 定义（标准化）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schema/action-metadata.v1.json",
  "title": "ActionMetadata",
  "type": "object",
  "required": ["apiVersion", "kind", "metadata", "spec"],
  "properties": {
    "apiVersion": {
      "type": "string",
      "const": "action.example.io/v1"
    },
    "kind": {
      "type": "string",
      "const": "Action"
    },
    "metadata": {
      "type": "object",
      "required": ["name", "namespace", "version", "title"],
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[a-zA-Z][a-zA-Z0-9_]{2,63}$",
          "description": "Action 名称"
        },
        "namespace": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9_.-]{1,127}$",
          "description": "命名空间（领域.上下文）"
        },
        "version": {
          "type": "string",
          "pattern": "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$",
          "description": "SemVer 版本号"
        },
        "title": {
          "type": "string",
          "maxLength": 100,
          "description": "显示标题"
        },
        "description": {
          "type": "string",
          "maxLength": 2048
        },
        "labels": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        },
        "owner": {
          "type": "string",
          "format": "email"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "spec": {
      "type": "object",
      "required": ["type", "protocol", "endpoint", "inputSchema", "outputSchema"],
      "properties": {
        "type": {
          "type": "string",
          "enum": ["SYNC", "ASYNC", "STREAM"]
        },
        "protocol": {
          "type": "string",
          "enum": ["HTTP", "GRPC", "MQ", "DUBBO"]
        },
        "endpoint": {
          "type": "object",
          "required": ["service", "path"],
          "properties": {
            "service": { "type": "string" },
            "path": { "type": "string" },
            "method": {
              "type": "string",
              "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"]
            },
            "topic": { "type": "string" },
            "timeoutMs": {
              "type": "integer",
              "minimum": 1,
              "maximum": 60000,
              "default": 5000
            }
          }
        },
        "inputSchema": { "type": "object" },
        "outputSchema": { "type": "object" },
        "errorSchema": { "type": "object" },
        "retryPolicy": {
          "type": "object",
          "properties": {
            "maxAttempts": {
              "type": "integer",
              "minimum": 0,
              "maximum": 10,
              "default": 3
            },
            "backoffMs": {
              "type": "integer",
              "minimum": 0,
              "maximum": 60000,
              "default": 1000
            },
            "retryableCodes": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        },
        "auth": {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string",
              "enum": ["NONE", "JWT", "MTLS", "AKSK"],
              "default": "JWT"
            },
            "scopes": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        },
        "idempotency": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": false },
            "keyHeader": { "type": "string", "default": "Idempotency-Key" },
            "ttlSeconds": {
              "type": "integer",
              "minimum": 1,
              "maximum": 86400,
              "default": 86400
            }
          }
        },
        "tenantScope": {
          "type": "string",
          "enum": ["GLOBAL", "TENANT_SPECIFIC"],
          "default": "TENANT_SPECIFIC"
        }
      }
    },
    "status": {
      "type": "object",
      "properties": {
        "state": {
          "type": "string",
          "enum": ["DRAFT", "ACTIVE", "DISABLED", "DEPRECATED", "REMOVED"]
        },
        "lastUpdatedAt": { "type": "string", "format": "date-time" },
        "usageStats": {
          "type": "object",
          "properties": {
            "totalCalls": { "type": "integer" },
            "successRate": { "type": "number" },
            "avgLatencyMs": { "type": "number" }
          }
        }
      }
    }
  }
}
```

---

## 4. 控制面服务设计（Action Registry Service）

### 4.1 核心职责

1. **Metadata 存储与查询**：持久化 Action 元数据
2. **生命周期管理**：状态流转控制
3. **Schema 校验**：入参/出参校验
4. **版本治理**：SemVer 管理、兼容性检查
5. **服务发现**：维护服务实例列表
6. **审计日志**：记录变更历史

### 4.2 控制面 API

#### 注册 Action
```http
POST /api/v1/registry/actions
Content-Type: application/json
Authorization: Bearer {token}

{
  "apiVersion": "action.example.io/v1",
  "kind": "Action",
  "metadata": {
    "name": "create",
    "namespace": "crm.customer",
    "version": "1.0.0",
    "title": "创建客户",
    "description": "创建新客户记录"
  },
  "spec": {
    "type": "SYNC",
    "protocol": "HTTP",
    "endpoint": {
      "service": "crm-service",
      "path": "/api/v1/customers",
      "method": "POST",
      "timeoutMs": 5000
    },
    "inputSchema": {...},
    "outputSchema": {...}
  }
}

# 响应
201 Created
{
  "code": "OK",
  "data": {
    "key": "crm.customer.create:1.0.0",
    "state": "DRAFT",
    "registeredAt": "2024-01-15T08:00:00Z"
  }
}
```

#### 状态变更
```http
# 激活
POST /api/v1/registry/actions/crm.customer.create:1.0.0/activate

# 弃用
POST /api/v1/registry/actions/crm.customer.create:1.0.0/deprecate
{
  "reason": "使用 v2.0.0 替代",
  "migrationGuide": "https://docs.example.com/migration/crm-v2",
  "deprecatedAt": "2024-06-01T00:00:00Z",
  "sunsetAt": "2024-12-01T00:00:00Z"
}

# 停用
POST /api/v1/registry/actions/crm.customer.create:1.0.0/disable
{
  "reason": "发现安全漏洞",
  "incidentId": "INC-2024-001"
}
```

#### 查询 Action
```http
# 获取指定版本
GET /api/v1/registry/actions/crm.customer.create:1.0.0

# 获取最新 ACTIVE 版本
GET /api/v1/registry/actions/crm.customer.create

# 搜索
GET /api/v1/registry/actions?namespace=crm.customer&state=ACTIVE&labels.env=prod

# 获取所有版本
GET /api/v1/registry/actions/crm.customer.create/versions
```

#### 验证 Schema
```http
POST /api/v1/registry/validate
{
  "input": {
    "customerName": "Acme Corp",
    "contact": {
      "phone": "13800138000"
    }
  },
  "against": "crm.customer.create:1.0.0",
  "type": "input"
}

# 响应
{
  "code": "OK",
  "data": {
    "valid": true,
    "errors": []
  }
}
```

### 4.3 数据存储模型

#### Action Definition 表
```sql
CREATE TABLE action_definition (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    action_key          VARCHAR(255) NOT NULL COMMENT '完整标识符: namespace.name:version',
    namespace           VARCHAR(128) NOT NULL COMMENT '命名空间',
    name                VARCHAR(64) NOT NULL COMMENT 'Action 名称',
    version             VARCHAR(32) NOT NULL COMMENT '版本号',
    full_name           VARCHAR(200) NOT NULL COMMENT 'namespace.name',
    state               VARCHAR(20) NOT NULL COMMENT 'DRAFT/ACTIVE/DEPRECATED/DISABLED/REMOVED',
    
    -- 元数据
    title               VARCHAR(100) NOT NULL,
    description         TEXT,
    labels_json         JSON,
    owner               VARCHAR(100),
    
    -- 规范
    spec_type           VARCHAR(20) COMMENT 'SYNC/ASYNC/STREAM',
    spec_protocol       VARCHAR(20) COMMENT 'HTTP/GRPC/MQ/DUBBO',
    endpoint_json       JSON COMMENT '服务端点配置',
    input_schema_json   JSON COMMENT '输入参数 Schema',
    output_schema_json  JSON COMMENT '输出结果 Schema',
    error_schema_json   JSON COMMENT '错误响应 Schema',
    retry_policy_json   JSON COMMENT '重试策略',
    auth_json           JSON COMMENT '认证配置',
    idempotency_json    JSON COMMENT '幂等配置',
    tenant_scope        VARCHAR(20) COMMENT 'GLOBAL/TENANT_SPECIFIC',
    tenant_id           VARCHAR(64) COMMENT '多租户ID',
    
    -- 生命周期
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activated_at        DATETIME,
    deprecated_at       DATETIME,
    deprecated_reason   TEXT,
    sunset_at           DATETIME COMMENT '计划下线时间',
    disabled_at         DATETIME,
    disabled_reason     TEXT,
    
    -- 统计
    total_calls         BIGINT DEFAULT 0,
    success_rate        DECIMAL(5,2),
    avg_latency_ms      INT,
    
    UNIQUE KEY uk_action_key (action_key),
    INDEX idx_namespace (namespace),
    INDEX idx_full_name (full_name),
    INDEX idx_state (state),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Action Audit Log 表
```sql
CREATE TABLE action_audit_log (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    action_key      VARCHAR(255) NOT NULL,
    operation       VARCHAR(50) NOT NULL COMMENT 'REGISTER/ACTIVATE/DEPRECATE/DISABLE/UPDATE/DELETE',
    operator        VARCHAR(100) NOT NULL,
    operator_id     VARCHAR(64),
    before_json     JSON,
    after_json      JSON,
    change_reason   TEXT,
    ip_address      VARCHAR(50),
    user_agent      VARCHAR(500),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_action_key (action_key),
    INDEX idx_operation (operation),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. 数据面 SDK 设计

### 5.1 SDK 核心组件

```java
/**
 * Action SDK 核心组件
 */
public class ActionSdkComponents {
    
    /**
     * 1. ActionScanner - 注解扫描器
     * 扫描 @ActionDefinition 注解，生成元数据
     */
    @Component
    public class ActionScanner {
        public List<ActionMetadata> scan(String basePackage);
    }
    
    /**
     * 2. ActionRegistryClient - 注册中心客户端
     * 向控制面注册/续租/下线
     */
    public interface ActionRegistryClient {
        void register(ActionMetadata metadata);
        void activate(String actionKey);
        void deprecate(String actionKey, DeprecateRequest request);
        void disable(String actionKey, String reason);
        void deregister(String actionKey);
        
        // 心跳续租
        void heartbeat(String actionKey);
    }
    
    /**
     * 3. ActionCatalog - 本地目录缓存
     * 带 TTL 和 watch 机制的本地缓存
     */
    public interface ActionCatalog {
        Optional<ActionMetadata> get(String actionKey);
        List<ActionMetadata> query(ActionQuery query);
        void refresh(String actionKey);
        void watch(String namespace, Consumer<WatchEvent> callback);
    }
    
    /**
     * 4. ActionInvoker - 统一调用入口
     * 本地优先、远程兜底、负载均衡
     */
    public interface ActionInvoker {
        <I, O> ActionResponse<O> invoke(String actionKey, I input);
        <I, O> ActionResponse<O> invoke(String actionKey, String version, I input);
        <I, O> ActionResponse<O> invoke(String actionKey, I input, InvokeOptions options);
        
        // 异步调用
        <I, O> CompletableFuture<ActionResponse<O>> invokeAsync(String actionKey, I input);
    }
    
    /**
     * 5. ActionDispatcher - 请求分发器
     * 接收远程调用请求，分发到本地 Handler
     */
    public interface ActionDispatcher {
        ActionResponse<Object> dispatch(ActionRequest request);
    }
    
    /**
     * 6. ActionCodec - 编解码与校验
     */
    public interface ActionCodec {
        void validateInput(ActionMetadata metadata, Object input);
        void validateOutput(ActionMetadata metadata, Object output);
        <T> T encode(Object obj, Class<T> targetType);
        <T> T decode(Object source, Class<T> targetType);
    }
}
```

### 5.2 开发者接口（注解驱动）

```java
/**
 * Action 定义注解
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Component
public @interface ActionDefinition {
    String namespace();
    String name();
    String version();
    String title();
    String description() default "";
    ActionType type() default ActionType.SYNC;
    String protocol() default "HTTP";
}

/**
 * Action Handler 接口
 */
public interface ActionHandler<I, O> {
    O execute(ActionContext context, I input) throws Exception;
}

/**
 * Action 上下文
 */
public record ActionContext(
    String requestId,
    String tenantId,
    String userId,
    String traceId,
    String actionKey,
    Map<String, Object> attributes
) {}

/**
 * 使用示例
 */
@ActionDefinition(
    namespace = "crm.customer",
    name = "create",
    version = "1.0.0",
    title = "创建客户",
    description = "创建新客户记录"
)
public class CreateCustomerAction implements ActionHandler<CreateCustomerInput, CreateCustomerOutput> {
    
    @Override
    public CreateCustomerOutput execute(ActionContext context, CreateCustomerInput input) {
        // 业务逻辑
        return new CreateCustomerOutput("CUST_001");
    }
}
```

### 5.3 Spring Boot 集成

```yaml
# application.yml
action:
  sdk:
    enabled: true
    service-name: crm-service
  
  registry:
    mode: embedded  # embedded / remote
    # remote 模式配置
    server-url: http://action-registry:8080
    api-key: xxx
    heartbeat-interval: 30s
  
  catalog:
    cache-ttl: 5m
    preload-on-startup: true
  
  invoker:
    default-timeout: 5000
    retry-enabled: true
    circuit-breaker-enabled: true
  
  # 多租户
  tenant:
    enabled: true
    header-name: X-Tenant-ID
    resolver: header  # header / jwt / custom
```

---

## 6. 统一调用协议

### 6.1 调用请求格式

```http
POST /api/action-invoke/{fullName}
Content-Type: application/json
X-Action-Version: 1.0.0        # 可选，默认路由到最新 ACTIVE
X-Request-Id: req-123456
X-Tenant-Id: tenant-001
Authorization: Bearer {jwt}
Idempotency-Key: idem-abc123    # 幂等键

{
  "context": {
    "tenantId": "tenant-001",
    "userId": "user-1001",
    "traceId": "7f6c8a...",
    "locale": "zh-CN",
    "clientIp": "192.168.1.1"
  },
  "input": {
    "customerName": "Acme Corporation",
    "contact": {
      "phone": "13800138000",
      "email": "contact@acme.com"
    }
  },
  "options": {
    "timeoutMs": 3000,
    "retryPolicy": {
      "maxAttempts": 2
    },
    "dryRun": false
  }
}
```

### 6.2 调用响应格式

**成功响应：**
```json
{
  "code": "OK",
  "message": "success",
  "requestId": "req-123456",
  "data": {
    "customerId": "CUST_20240115_001",
    "customerName": "Acme Corporation",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T08:30:00Z"
  },
  "error": null,
  "meta": {
    "actionKey": "crm.customer.create:1.0.0",
    "durationMs": 78,
    "provider": "crm-service-01",
    "cached": false
  }
}
```

**错误响应：**
```json
{
  "code": "VALIDATION_ERROR",
  "message": "输入参数校验失败",
  "requestId": "req-123456",
  "data": null,
  "error": {
    "type": "ValidationException",
    "retryable": false,
    "details": {
      "field": "contact.phone",
      "constraint": "pattern",
      "message": "手机号格式不正确"
    }
  },
  "meta": {
    "actionKey": "crm.customer.create:1.0.0",
    "durationMs": 5
  }
}
```

### 6.3 标准错误码

| 错误码 | 说明 | HTTP状态码 | 是否可重试 |
|--------|------|-----------|-----------|
| OK | 成功 | 200 | - |
| VALIDATION_ERROR | 参数校验失败 | 400 | 否 |
| UNAUTHORIZED | 未认证 | 401 | 否 |
| FORBIDDEN | 无权限 | 403 | 否 |
| ACTION_NOT_FOUND | Action 不存在 | 404 | 否 |
| VERSION_NOT_FOUND | 版本不存在 | 404 | 否 |
| METHOD_NOT_ALLOWED | 方法不允许 | 405 | 否 |
| TIMEOUT | 执行超时 | 408 | 是 |
| CONFLICT | 资源冲突 | 409 | 否 |
| IDEMPOTENCY_VIOLATION | 幂等性冲突 | 409 | 否 |
| RATE_LIMITED | 限流 | 429 | 是 |
| SERVICE_UNAVAILABLE | 服务不可用 | 503 | 是 |
| CIRCUIT_BREAKER_OPEN | 熔断器开启 | 503 | 是 |
| INTERNAL_ERROR | 内部错误 | 500 | 否 |

---

## 7. 微服务远程调用

### 7.1 路由流程

```
调用方发起 invoke(fullName, version, input)
         │
         ▼
    ┌─────────────────┐
    │ 1. 解析目标     │───► 拆分 namespace, name, version
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ 2. 查询 Catalog │───► 本地缓存命中？───是──► 使用缓存
    └────────┬────────┘                      │
             │ 否                            │
             ▼                                │
    ┌─────────────────┐                       │
    │ 3. 查询 Registry│───► 调用控制面 API    │
    └────────┬────────┘                       │
             │                                │
             ▼                                │
    ┌─────────────────┐                       │
    │ 4. 状态检查     │───► ACTIVE？          │
    └────────┬────────┘                       │
             │ 否                            │
             ▼                                │
    返回 DEPRECATED / DISABLED 错误          │
             │                                │
             ▼                                │
    ┌─────────────────┐◄─────────────────────┘
    │ 5. 选择实例     │───► 服务发现 + 负载均衡
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ 6. 选择协议     │───► HTTP/gRPC/MQ/Dubbo
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ 7. 执行调用     │───► 超时/重试/熔断控制
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ 8. 处理响应     │───► 解码/校验/返回
    └─────────────────┘
```

### 7.2 负载均衡策略

```java
public interface LoadBalanceStrategy {
    ServiceInstance select(List<ServiceInstance> instances, InvocationContext context);
}

// 轮询
public class RoundRobinStrategy implements LoadBalanceStrategy {
    private final AtomicInteger counter = new AtomicInteger(0);
    
    @Override
    public ServiceInstance select(List<ServiceInstance> instances, InvocationContext context) {
        int index = counter.getAndIncrement() % instances.size();
        return instances.get(index);
    }
}

// 加权轮询
public class WeightedRoundRobinStrategy implements LoadBalanceStrategy {
    @Override
    public ServiceInstance select(List<ServiceInstance> instances, InvocationContext context) {
        // 根据实例权重选择
    }
}

// 最少连接
public class LeastConnectionsStrategy implements LoadBalanceStrategy {
    @Override
    public ServiceInstance select(List<ServiceInstance> instances, InvocationContext context) {
        return instances.stream()
            .min(Comparator.comparingInt(ServiceInstance::getActiveConnections))
            .orElse(instances.get(0));
    }
}

// 一致性哈希（适用于缓存场景）
public class ConsistentHashStrategy implements LoadBalanceStrategy {
    @Override
    public ServiceInstance select(List<ServiceInstance> instances, InvocationContext context) {
        String key = context.getTenantId() + ":" + context.getUserId();
        // 一致性哈希计算
    }
}
```

### 7.3 弹性治理

```java
/**
 * 调用选项
 */
public class InvokeOptions {
    private long timeoutMs = 5000;
    private int maxRetries = 3;
    private long backoffMs = 1000;
    private boolean idempotent = false;
    private String preferredZone;
    private String preferredVersion;
    private boolean fallbackEnabled = true;
    private Map<String, String> headers;
}

/**
 * 熔断器配置
 */
public class CircuitBreakerConfig {
    private int failureRateThreshold = 50;        // 失败率阈值（%）
    private int slowCallRateThreshold = 80;       // 慢调用阈值（%）
    private long slowCallDurationThreshold = 1000; // 慢调用时间（ms）
    private int minNumberOfCalls = 10;            // 最小统计样本
    private long waitDurationInOpenState = 30000; // 熔断持续时间（ms）
    private int permittedNumberOfCallsInHalfOpenState = 5; // 半开允许调用数
}

/**
 * 限流配置
 */
public class RateLimitConfig {
    private int permitsPerSecond = 100;           // 每秒令牌数
    private int burstCapacity = 200;              // 突发容量
    private boolean tenantIsolation = true;       // 租户隔离
}
```

---

## 8. 可观测性设计

### 8.1 指标（Metrics）

```yaml
# Prometheus 指标

# Action 调用次数
action_invoke_total:
  type: counter
  labels: [action_key, action_type, protocol, result_code, tenant_id]
  
# Action 调用延迟
action_invoke_duration_seconds:
  type: histogram
  labels: [action_key, action_type]
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

# Action 活跃连接数
action_active_connections:
  type: gauge
  labels: [action_key, instance_id]

# Action 注册次数
action_registry_operations_total:
  type: counter
  labels: [operation, result]

# Action 缓存命中率
action_catalog_cache_hit_ratio:
  type: gauge

# 熔断器状态
action_circuit_breaker_state:
  type: gauge
  labels: [action_key, state]  # state: closed/open/half_open

# 限流触发次数
action_rate_limited_total:
  type: counter
  labels: [action_key, tenant_id]
```

### 8.2 日志（Logging）

```java
// 结构化日志字段
public class LogFields {
    public static final String REQUEST_ID = "requestId";
    public static final String TRACE_ID = "traceId";
    public static final String TENANT_ID = "tenantId";
    public static final String USER_ID = "userId";
    public static final String ACTION_KEY = "actionKey";
    public static final String ACTION_TYPE = "actionType";
    public static final String PROTOCOL = "protocol";
    public static final String DURATION_MS = "durationMs";
    public static final String RESULT_CODE = "resultCode";
    public static final String RETRY_COUNT = "retryCount";
    public static final String TARGET_INSTANCE = "targetInstance";
}

// 日志示例（JSON 格式）
{
  "timestamp": "2024-01-15T08:30:00.123Z",
  "level": "INFO",
  "logger": "ActionInvoker",
  "message": "Action invoked successfully",
  "context": {
    "requestId": "req-123456",
    "traceId": "7f6c8a...",
    "tenantId": "tenant-001",
    "userId": "user-1001"
  },
  "action": {
    "actionKey": "crm.customer.create:1.0.0",
    "actionType": "SYNC",
    "protocol": "HTTP"
  },
  "metrics": {
    "durationMs": 78,
    "resultCode": "OK",
    "retryCount": 0
  },
  "target": {
    "service": "crm-service",
    "instance": "192.168.1.10:8080"
  }
}
```

### 8.3 链路追踪（Tracing）

```java
// OpenTelemetry 集成
public class ActionTracing {
    
    private static final Tracer tracer = GlobalOpenTelemetry.getTracer("action-sdk");
    
    public <I, O> ActionResponse<O> invokeWithTracing(String actionKey, I input) {
        Span span = tracer.spanBuilder("action.invoke")
            .setAttribute("action.key", actionKey)
            .setAttribute("action.type", getActionType(actionKey))
            .startSpan();
        
        try (Scope scope = span.makeCurrent()) {
            // 执行调用
            ActionResponse<O> response = doInvoke(actionKey, input);
            
            span.setAttribute("action.result_code", response.getCode());
            span.setAttribute("action.duration_ms", response.getMeta().getDurationMs());
            
            if (!response.isSuccess()) {
                span.setStatus(StatusCode.ERROR, response.getError().getMessage());
            }
            
            return response;
        } catch (Exception e) {
            span.setStatus(StatusCode.ERROR, e.getMessage());
            span.recordException(e);
            throw e;
        } finally {
            span.end();
        }
    }
}

// Span 命名规范
// - action.invoke/{fullName}              # 调用
// - action.registry.register              # 注册
// - action.registry.query                 # 查询
// - action.catalog.refresh                # 缓存刷新
// - action.codec.validate                 # 参数校验
```

---

## 9. 多租户设计

### 9.1 租户范围

```java
public enum TenantScope {
    /**
     * 全局共享，所有租户可见
     */
    GLOBAL,
    
    /**
     * 租户专属，仅特定租户可见
     */
    TENANT_SPECIFIC
}
```

### 9.2 租户隔离策略

| 隔离级别 | 说明 | 适用场景 |
|---------|------|---------|
| **逻辑隔离** | 同一 Action 实现，数据按 tenant_id 隔离 | 标准 SaaS |
| **实例隔离** | 不同租户路由到不同服务实例 | 大租户专享 |
| **版本隔离** | 不同租户使用不同版本 | 灰度发布 |

### 9.3 租户解析器

```java
public interface TenantResolver {
    String resolve(ActionRequest request);
}

// 从 Header 解析
public class HeaderTenantResolver implements TenantResolver {
    @Override
    public String resolve(ActionRequest request) {
        return request.getHeader("X-Tenant-ID");
    }
}

// 从 JWT Token 解析
public class JwtTenantResolver implements TenantResolver {
    @Override
    public String resolve(ActionRequest request) {
        String token = request.getHeader("Authorization");
        return JwtUtils.extractTenantId(token);
    }
}

// 从子域名解析
public class SubdomainTenantResolver implements TenantResolver {
    @Override
    public String resolve(ActionRequest request) {
        String host = request.getHeader("Host");
        return host.split("\\.")[0];  // tenant1.example.com
    }
}
```

---

## 10. 版本治理策略

### 10.1 版本路由规则

```
调用方请求: crm.customer.create (未指定版本)
                │
                ▼
    ┌───────────────────────┐
    │ 查找 ACTIVE 版本列表   │
    │ - 1.0.0 (DEPRECATED)  │
    │ - 1.0.1 (ACTIVE)      │
    │ - 2.0.0 (ACTIVE)      │
    └───────────┬───────────┘
                │
    ┌───────────┴───────────┐
    │ 路由策略               │
    ├───────────────────────┤
    │ 1. 无偏好 ──► 最新 MAJOR │
    │    结果: 2.0.0         │
    │                        │
    │ 2. X-Version-Policy:   │
    │    compatible          │
    │    结果: 1.0.1 (与当前兼容)│
    │                        │
    │ 3. X-Preferred-Version:│
    │    1.x                 │
    │    结果: 1.0.1         │
    └───────────────────────┘
```

### 10.2 兼容性检查

```java
public class SchemaCompatibilityChecker {
    
    /**
     * 检查向后兼容性
     */
    public CompatibilityResult checkBackwardCompatibility(
            JsonSchema oldSchema, 
            JsonSchema newSchema) {
        
        List<BreakingChange> breakingChanges = new ArrayList<>();
        
        // 检查必填字段
        Set<String> oldRequired = getRequiredFields(oldSchema);
        Set<String> newRequired = getRequiredFields(newSchema);
        
        if (!oldRequired.containsAll(newRequired)) {
            breakingChanges.add(new BreakingChange(
                "REQUIRED_FIELD_ADDED",
                "新增必填字段",
                Sets.difference(newRequired, oldRequired)
            ));
        }
        
        // 检查字段删除
        Set<String> oldFields = getFieldNames(oldSchema);
        Set<String> newFields = getFieldNames(newSchema);
        
        if (!newFields.containsAll(oldFields)) {
            breakingChanges.add(new BreakingChange(
                "FIELD_REMOVED",
                "删除字段",
                Sets.difference(oldFields, newFields)
            ));
        }
        
        // 检查类型变更
        // ...
        
        return new CompatibilityResult(breakingChanges.isEmpty(), breakingChanges);
    }
}
```

---

## 11. 实施路线图

### 阶段 1：MVP（4-6 周）

- [ ] 控制面基础：Metadata CRUD + 状态管理
- [ ] 数据面 SDK：注解扫描 + HTTP 调用
- [ ] 统一调用协议：请求/响应 Envelope
- [ ] 嵌入式模式：单机可用

### 阶段 2：企业级（6-8 周）

- [ ] 独立控制面服务
- [ ] 多协议支持：gRPC/MQ
- [ ] 弹性治理：熔断/限流/重试
- [ ] 服务发现：Nacos/Consul 集成

### 阶段 3：治理增强（持续）

- [ ] 多租户完整支持
- [ ] 版本治理：灰度/金丝雀
- [ ] 可观测性：完整 Metrics/Tracing
- [ ] Gateway：统一入口
- [ ] 可视化控制台

---

## 12. 总结

本设计融合了 NocoBase 的插件化思想和云原生控制面/数据面分离架构：

| 特性 | 说明 |
|------|------|
| **控制面分离** | 独立的 Registry Service，集中管理元数据和生命周期 |
| **版本治理** | SemVer + 生命周期状态 + 兼容性检查 |
| **多租户** | 逻辑隔离 + 实例隔离 + 版本隔离 |
| **弹性治理** | 熔断/限流/重试/负载均衡 |
| **可观测性** | Metrics + Logging + Tracing 全覆盖 |
| **渐进落地** | 嵌入式 → 独立模式 → 完整治理 |
