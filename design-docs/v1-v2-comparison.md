# V1 vs V2 设计对比

## 概述

本文档对比两个版本的设计差异，说明 V2 如何融合 Codex 设计的优点进行改进。

---

## 架构对比

### V1 架构（内嵌式）

```
┌─────────────────────────────────────────┐
│           Service A (单体)               │
│  ┌─────────────────────────────────┐   │
│  │    Global Action Registry        │   │
│  │    (内存 Map)                    │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │    Service Action Registry       │   │
│  │    (资源级注册)                  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │    ActionEngine                  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**特点：**
- 无外部依赖，单机运行
- 适合小型项目
- 缺乏治理能力

### V2 架构（控制面/数据面分离）

```
┌─────────────────────────────────────────┐
│      🎛️ Control Plane (控制面)          │
│  ┌─────────────────────────────────┐   │
│  │   Action Registry Service        │   │
│  │   - Metadata 存储                │   │
│  │   - 生命周期管理                 │   │
│  │   - 版本治理                     │   │
│  │   - Schema 校验                  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Service A│ │ Service B│ │ Service C│
│  📦 SDK   │ │  📦 SDK   │ │  📦 SDK   │
└──────────┘ └──────────┘ └──────────┘
```

**特点：**
- 控制面独立部署
- 集中治理
- 适合微服务架构
- 支持多模式（嵌入式/独立）

---

## 功能对比

| 功能 | V1 | V2 | 说明 |
|------|-----|-----|------|
| **部署模式** | 仅嵌入式 | 嵌入式 + 独立模式 | V2 支持渐进式演进 |
| **生命周期管理** | ❌ | ✅ | DRAFT/ACTIVE/DEPRECATED/DISABLED |
| **版本治理** | 简单版本号 | SemVer + 兼容性检查 | V2 支持版本路由策略 |
| **多租户** | ❌ | ✅ | GLOBAL/TENANT_SPECIFIC |
| **Schema 校验** | 基础校验 | JSON Schema 2020-12 | V2 标准化校验 |
| **审计日志** | ❌ | ✅ | 完整变更历史 |
| **服务发现** | 基础实现 | 集成 Nacos/Consul | V2 生产级 |
| **弹性治理** | 基础熔断 | 熔断+限流+重试 | V2 完整治理 |
| **可观测性** | 基础日志 | Metrics+Logging+Tracing | V2 云原生标准 |
| **幂等控制** | ❌ | ✅ | 内置幂等支持 |

---

## 核心接口对比

### Action 标识

**V1:**
```
serviceName:resourceName:actionName
# 示例: user-service:user:create
```

**V2:**
```
{domain}.{boundedContext}.{actionName}:{version}
# 示例: crm.customer.create:1.0.0
```

**改进：**
- 引入 SemVer 版本管理
- 更符合领域驱动设计
- 支持版本路由

### Action 元数据

**V1:**
```java
public interface ActionDefinition {
    String getName();
    String getResourceName();
    String getServiceName();
    ActionMetadata getMetadata();
}
```

**V2:**
```yaml
apiVersion: action.example.io/v1
kind: Action
metadata:
  name: create
  namespace: crm.customer
  version: 1.0.0
  title: 创建客户
spec:
  type: SYNC
  protocol: HTTP
  endpoint:
    service: crm-service
    path: /api/v1/customers
  inputSchema: {...}
  outputSchema: {...}
status:
  state: ACTIVE
```

**改进：**
- Kubernetes CRD 风格
- 状态分离 (spec/status)
- 完整的生命周期信息

### 调用接口

**V1:**
```java
public interface ActionEngine {
    ActionResult execute(String actionName, Map<String, Object> params);
}
```

**V2:**
```java
public interface ActionInvoker {
    <I, O> ActionResponse<O> invoke(String actionKey, I input);
    <I, O> ActionResponse<O> invoke(String actionKey, String version, I input);
    <I, O> CompletableFuture<ActionResponse<O>> invokeAsync(String actionKey, I input);
}
```

**改进：**
- 泛型支持类型安全
- 显式版本控制
- 异步调用支持

---

## 代码实现对比

### 服务注册

**V1:**
```java
@Component
public class DefaultGlobalActionRegistry implements GlobalActionRegistry {
    private final Map<String, ActionDefinition> actionIndex = new ConcurrentHashMap<>();
    
    public void registerAction(ActionDefinition action) {
        actionIndex.put(action.getQualifiedName(), action);
    }
}
```

**V2:**
```java
@Service
public class ActionRegistryService {
    @Transactional
    public RegisterResult register(RegisterRequest request) {
        // 1. 校验 Schema
        validateSchemas(request);
        
        // 2. 检查是否已存在
        checkDuplicate(request);
        
        // 3. 检查兼容性
        checkCompatibility(request);
        
        // 4. 持久化
        repository.insert(entity);
        
        // 5. 审计日志
        saveAuditLog(actionKey, "REGISTER", ...);
        
        // 6. 发布事件
        eventPublisher.publishEvent(new ActionRegisteredEvent(...));
    }
}
```

**改进：**
- 数据库持久化
- 事务保证
- 审计日志
- 事件驱动

### 远程调用

**V1:**
```java
public class HttpRemoteActionProxy implements RemoteActionProxy {
    public Object execute(ActionContext context) {
        // 直接 HTTP 调用
        ResponseEntity<RemoteActionResponse> response = 
            restTemplate.postForEntity(url, request, RemoteActionResponse.class);
        return response.getBody().getData();
    }
}
```

**V2:**
```java
public class ActionInvoker {
    public <I, O> ActionResponse<O> invoke(String actionKey, I input) {
        // 1. 从 Catalog 获取元数据
        ActionMetadata metadata = catalog.get(actionKey);
        
        // 2. 检查状态
        if (!metadata.isInvocable()) {
            throw new ActionStateException(metadata.getState());
        }
        
        // 3. 负载均衡选择实例
        ServiceInstance instance = loadBalancer.select(instances);
        
        // 4. 熔断器检查
        if (circuitBreaker.isOpen(actionKey)) {
            throw new CircuitBreakerOpenException(actionKey);
        }
        
        // 5. 限流检查
        if (!rateLimiter.tryAcquire(actionKey)) {
            throw new RateLimitExceededException(actionKey);
        }
        
        // 6. 执行调用
        return doInvoke(metadata, instance, input);
    }
}
```

**改进：**
- 元数据驱动
- 完整的治理链路
- 弹性控制

---

## 治理功能对比

### 版本治理

**V1:**
- 简单版本号匹配
- 无兼容性检查
- 无弃用策略

**V2:**
```java
// 版本路由策略
public ActionMetadata route(String namespace, String name, String preferredVersion) {
    // 1. 精确匹配
    if (preferredVersion != null) {
        return findExact(namespace, name, preferredVersion);
    }
    
    // 2. 策略路由
    switch (policy) {
        case LATEST:
            return findLatestActive(namespace, name);
        case COMPATIBLE:
            return findCompatibleVersion(namespace, name, currentVersion);
        case STABLE:
            return findOldestActive(namespace, name);
    }
}

// 兼容性检查
public CompatibilityResult checkCompatibility(JsonSchema oldSchema, JsonSchema newSchema) {
    // 检查必填字段变更
    // 检查字段删除
    // 检查类型变更
}
```

### 多租户

**V1:** 无

**V2:**
```java
public enum TenantScope {
    GLOBAL,         // 全局共享
    TENANT_SPECIFIC // 租户隔离
}

// 租户解析
public interface TenantResolver {
    String resolve(ActionRequest request);
}

// 数据隔离
@Select("SELECT * FROM action_definition WHERE tenant_id = #{tenantId} OR tenant_scope = 'GLOBAL'")
List<ActionMetadata> queryByTenant(@Param("tenantId") String tenantId);
```

### 可观测性

**V1:** 基础日志

**V2:**
```yaml
# Metrics
action_invoke_total{action_key, result_code}
action_invoke_duration_seconds_bucket{action_key}
action_circuit_breaker_state{action_key, state}
action_rate_limited_total{action_key}

# Logging (结构化 JSON)
{
  "timestamp": "2024-01-15T08:30:00.123Z",
  "level": "INFO",
  "action": {
    "actionKey": "crm.customer.create:1.0.0",
    "actionType": "SYNC"
  },
  "metrics": {
    "durationMs": 78,
    "resultCode": "OK"
  }
}

# Tracing (OpenTelemetry)
span.name: action.invoke/crm.customer.create
span.attributes:
  - action.key: crm.customer.create:1.0.0
  - action.result_code: OK
  - action.duration_ms: 78
```

---

## 实施建议

### 何时使用 V1

- 小型项目/单体应用
- 快速原型开发
- 无治理需求
- 团队规模 < 10 人

### 何时使用 V2

- 微服务架构
- 多团队协作
- 需要版本治理
- 多租户需求
- 生产级要求

### 迁移路径

```
阶段 1: 内嵌模式 (V1)
    │
    ▼ 业务增长
    
阶段 2: 混合模式
    │
    ├── 引入控制面服务
    ├── 保持 V1 API 兼容
    └── 逐步迁移元数据
    │
    ▼ 完全迁移
    
阶段 3: 独立模式 (V2)
    │
    ├── 完整的控制面
    ├── 多服务共享
    └── 完整治理能力
```

---

## 总结

| 维度 | V1 | V2 |
|------|-----|-----|
| **定位** | 轻量级框架 | 企业级平台 |
| **复杂度** | 低 | 中等 |
| **功能** | 基础 | 完整 |
| **运维成本** | 低 | 中等 |
| **适用场景** | 小型项目 | 中大型微服务 |
| **扩展性** | 有限 | 强 |
| **治理能力** | 弱 | 强 |

**V2 的核心改进：**
1. ✅ 控制面/数据面分离
2. ✅ 完整的生命周期管理
3. ✅ SemVer 版本治理
4. ✅ 多租户支持
5. ✅ 标准化 Schema
6. ✅ 审计与可观测性
7. ✅ 渐进式部署模式
