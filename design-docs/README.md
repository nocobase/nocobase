# Java Action 注册机制

借鉴 NocoBase 架构思想设计的面向微服务的 Java Action 注册机制。

## 快速开始

### 1. 添加依赖

```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>action-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

### 2. 配置文件

```yaml
# application.yml
action:
  service-name: user-service
  gateway-enabled: true
  gateway-path: /api
  security:
    enabled: true
  discovery:
    enabled: true
    registry-type: nacos
    server-addr: localhost:8848
```

### 3. 定义 Action 资源

```java
@ActionResource(value = "user", description = "用户管理")
@Component
public class UserResource {
    
    @Autowired
    private UserService userService;
    
    @Action(value = "create", title = "创建用户")
    public User create(
            @ActionParam("username") String username,
            @ActionParam("email") String email) {
        return userService.create(username, email);
    }
    
    @Action(value = "get", title = "查询用户")
    public User get(@ActionParam("id") String id) {
        return userService.findById(id);
    }
    
    @Action(value = "list", title = "用户列表")
    public PageResult<User> list(
            @ActionParam(value = "page", defaultValue = "1") int page,
            @ActionParam(value = "pageSize", defaultValue = "20") int pageSize) {
        return userService.findAll(page, pageSize);
    }
}
```

### 4. 调用 Action

#### 4.1 HTTP 接口调用

```bash
# 创建用户
curl -X POST http://localhost:8080/api/user-service/user/create \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "email": "john@example.com"}'

# 查询用户
curl http://localhost:8080/api/user-service/user/get?id=123
```

#### 4.2 程序化调用

```java
@Service
public class OrderService {
    
    @Autowired
    private ActionEngine actionEngine;
    
    public Order createOrder(String userId, String productId) {
        // 调用本地或其他服务的 Action
        ActionResult result = actionEngine.execute(
            "user-service:user:get",
            Map.of("id", userId)
        );
        
        User user = result.getData();
        // ...
    }
}
```

#### 4.3 跨服务调用

```java
@Service
public class InventoryService {
    
    @Autowired
    private ActionEngine actionEngine;
    
    public void checkStock(String productId, int quantity) {
        // 调用远程库存服务
        ActionResult result = actionEngine.execute(
            "inventory-service:stock:check",  // 服务名:资源名:Action名
            Map.of(
                "productId", productId,
                "quantity", quantity
            )
        );
        
        if (!result.isSuccess()) {
            throw new InsufficientStockException(result.getErrorMessage());
        }
    }
}
```

## 核心概念

### Action 定义

Action 是可执行的业务操作单元，包含：
- **名称**: 唯一标识符
- **元数据**: 输入输出参数定义、错误码、HTTP 映射等
- **处理器**: 具体的执行逻辑

### 注册表层级

```
GlobalActionRegistry (全局注册表)
    ├── ServiceActionRegistry (服务A)
    │       ├── Resource: user
    │       │       ├── Action: create
    │       │       ├── Action: get
    │       │       └── Action: list
    │       └── Resource: order
    │               ├── Action: create
    │               └── Action: cancel
    └── ServiceActionRegistry (服务B)
            └── Resource: inventory
                    ├── Action: check
                    └── Action: deduct
```

### 调用方式

1. **HTTP 网关**: 自动暴露 REST API
2. **程序化调用**: 通过 ActionEngine
3. **批处理**: 批量执行多个 Action
4. **管道**: 链式执行多个 Action

## 高级特性

### 1. 拦截器

```java
@Component
public class AuditInterceptor implements ActionInterceptor {
    
    @Override
    public Object intercept(ActionInvocation invocation) throws ActionException {
        ActionContext context = invocation.getContext();
        
        // 记录审计日志
        auditLog.record(context.getAction().getName(), context.getCurrentUser());
        
        return invocation.proceed();
    }
    
    @Override
    public int getOrder() {
        return 100; // 执行顺序
    }
}
```

### 2. 自定义协议

```java
@Component
public class GrpcProtocolHandler implements ProtocolHandler {
    
    @Override
    public String getProtocol() {
        return "grpc";
    }
    
    @Override
    public Object invoke(RemoteActionProxy proxy, ActionContext context) {
        // gRPC 调用实现
    }
}
```

### 3. 事件监听

```java
@Component
public class ActionEventListener implements ActionRegistryListener {
    
    @Override
    public void onRegistryChange(RegistryEvent event) {
        if (event.getType() == RegistryEventType.REGISTERED) {
            System.out.println("Action registered: " + event.getAction().getName());
        }
    }
}
```

## 架构对比

| 特性 | NocoBase (Node.js) | 本设计 (Java) |
|------|-------------------|---------------|
| 插件系统 | ✅ Plugin/PluginManager | ✅ ActionPlugin/ActionPluginManager |
| Action 注册 | ✅ Engine/Model 两层 | ✅ Global/Service/Resource 三层 |
| 资源定义 | ✅ Resource/Action | ✅ ActionResource/Action |
| 上下文 | ✅ Context | ✅ ActionContext |
| 拦截器 | ✅ Middleware | ✅ ActionInterceptor |
| 微服务支持 | ❌ | ✅ 内置支持 |
| 注解驱动 | ❌ | ✅ 完整支持 |
| 类型安全 | ⚠️ 弱类型 | ✅ 强类型 |

## 项目结构

```
design-docs/
├── java-action-registry-design.md    # 详细设计文档
├── core-implementation.java          # 核心类实现
├── spring-boot-starter.java          # Spring Boot Starter
└── README.md                         # 本文件
```

## 技术栈

- **Java 11+**
- **Spring Boot 2.7+**
- **Spring Cloud** (微服务)
- **Nacos** (服务注册发现)
- **Jackson** (JSON 处理)
- **JSON Schema Validator** (参数验证)

## 配置参考

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `action.service-name` | `default-service` | 当前服务名称 |
| `action.gateway-enabled` | `true` | 是否启用网关 |
| `action.gateway-path` | `/api` | 网关路径前缀 |
| `action.security.enabled` | `true` | 是否启用安全验证 |
| `action.validation.enabled` | `true` | 是否启用参数验证 |
| `action.discovery.enabled` | `false` | 是否启用服务发现 |
| `action.remote.protocol` | `http` | 远程调用协议 |
| `action.remote.timeout` | `30000` | 超时时间(ms) |

## 许可证

MIT
