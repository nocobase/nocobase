# 基于 Java 的 Action 注册机制设计文档

## 1. 架构概述

### 1.1 设计目标

借鉴 NocoBase 的架构思想，设计一套面向微服务架构的 Java Action 注册机制，实现：

- **插件化扩展**：支持动态注册和卸载 Action
- **微服务适配**：本地 Action 和远程 Action 统一调用
- **分层注册**：全局注册表 + 服务级注册表 + 资源级注册表
- **统一调用**：标准化的 Action 调用方式

### 1.2 核心概念对照

| NocoBase (Node.js) | Java 设计 | 说明 |
|-------------------|-----------|------|
| Plugin | ActionPlugin | 插件基类 |
| PluginManager | ActionPluginManager | 插件生命周期管理 |
| Resource | ActionResource | 资源定义 |
| Action | ActionDefinition | Action 定义 |
| FlowEngine | ActionEngine | Action 执行引擎 |
| EngineActionRegistry | GlobalActionRegistry | 全局 Action 注册表 |
| ModelActionRegistry | ServiceActionRegistry | 服务级 Action 注册表 |
| Context | ActionContext | 执行上下文 |

### 1.3 架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Action Engine (Gateway)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Global Action Registry                           │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │   │
│  │  │ Action: create│ │ Action: get  │ │ Action: list │  ...           │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Service A (Local)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   Service Action Registry                            │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │                     UserResource                               │ │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │ │   │
│  │  │  │ register │ │  login   │ │ logout   │ │ profile  │         │ │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Service B (Remote)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   Service Action Registry (Proxy)                    │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │                   OrderResource (RPC Proxy)                    │ │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │ │   │
│  │  │  │  create  │ │  query   │ │  cancel  │                       │ │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘                       │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心接口设计

### 2.1 Action 定义接口

```java
/**
 * Action 定义接口
 * 描述一个可执行的 Action 的元数据和处理逻辑
 */
public interface ActionDefinition {
    
    /**
     * Action 唯一标识符
     * 格式: [serviceName]:[resourceName]:[actionName] 或 [resourceName]:[actionName]
     */
    String getName();
    
    /**
     * Action 显示名称
     */
    String getTitle();
    
    /**
     * Action 描述
     */
    String getDescription();
    
    /**
     * 所属资源名称
     */
    String getResourceName();
    
    /**
     * 所属服务名称（微服务场景）
     */
    String getServiceName();
    
    /**
     * Action 元数据 Schema
     */
    ActionMetadata getMetadata();
    
    /**
     * 执行处理器
     */
    ActionHandler getHandler();
    
    /**
     * 是否是远程 Action
     */
    boolean isRemote();
    
    /**
     * 远程服务地址（仅远程 Action）
     */
    String getRemoteEndpoint();
}
```

### 2.2 Action 执行上下文

```java
/**
 * Action 执行上下文
 * 包含执行所需的所有上下文信息
 */
public interface ActionContext {
    
    /**
     * 获取当前 Action 定义
     */
    ActionDefinition getAction();
    
    /**
     * 获取请求参数
     */
    ActionParams getParams();
    
    /**
     * 设置参数值
     */
    void setParam(String key, Object value);
    
    /**
     * 获取参数值
     */
    <T> T getParam(String key);
    
    /**
     * 获取当前用户信息
     */
    UserInfo getCurrentUser();
    
    /**
     * 获取请求头信息
     */
    Map<String, String> getHeaders();
    
    /**
     * 设置执行结果
     */
    void setResult(Object result);
    
    /**
     * 获取执行结果
     */
    <T> T getResult();
    
    /**
     * 获取属性（用于在 Action 链中传递数据）
     */
    <T> T getAttribute(String key);
    
    /**
     * 设置属性
     */
    void setAttribute(String key, Object value);
    
    /**
     * 获取服务实例（用于依赖注入）
     */
    <T> T getService(Class<T> serviceClass);
    
    /**
     * 获取上下文唯一标识
     */
    String getRequestId();
    
    /**
     * 创建子上下文（用于嵌套调用）
     */
    ActionContext createSubContext();
}
```

### 2.3 Action 处理器接口

```java
/**
 * Action 处理器接口
 * 具体的 Action 执行逻辑
 */
@FunctionalInterface
public interface ActionHandler {
    
    /**
     * 执行 Action
     * @param context 执行上下文
     * @return 执行结果
     */
    Object execute(ActionContext context) throws ActionException;
    
    /**
     * 是否需要异步执行
     */
    default boolean isAsync() {
        return false;
    }
    
    /**
     * 执行超时时间（毫秒）
     */
    default long getTimeout() {
        return 30000L;
    }
}
```

---

## 3. Action 注册机制

### 3.1 三层注册架构

```java
/**
 * 全局 Action 注册表
 * 管理所有服务的 Action 注册
 */
public interface GlobalActionRegistry {
    
    /**
     * 注册 Action
     */
    void registerAction(ActionDefinition action);
    
    /**
     * 批量注册 Actions
     */
    void registerActions(String serviceName, Map<String, ActionDefinition> actions);
    
    /**
     * 注销 Action
     */
    void unregisterAction(String actionName);
    
    /**
     * 获取 Action 定义
     */
    ActionDefinition getAction(String actionName);
    
    /**
     * 获取 Action 定义（带服务名）
     * @param qualifiedName 格式: serviceName:resourceName:actionName
     */
    ActionDefinition getAction(String serviceName, String resourceName, String actionName);
    
    /**
     * 查询所有 Actions
     */
    List<ActionDefinition> getAllActions();
    
    /**
     * 按服务查询 Actions
     */
    List<ActionDefinition> getActionsByService(String serviceName);
    
    /**
     * 按资源查询 Actions
     */
    List<ActionDefinition> getActionsByResource(String serviceName, String resourceName);
    
    /**
     * 判断 Action 是否存在
     */
    boolean hasAction(String actionName);
    
    /**
     * 添加注册监听器
     */
    void addRegistryListener(ActionRegistryListener listener);
    
    /**
     * 移除注册监听器
     */
    void removeRegistryListener(ActionRegistryListener listener);
}
```

### 3.2 服务级注册表

```java
/**
 * 服务级 Action 注册表
 * 每个微服务实例维护自己的 Action 注册表
 */
public interface ServiceActionRegistry {
    
    /**
     * 获取服务名称
     */
    String getServiceName();
    
    /**
     * 注册本地 Action
     */
    void registerLocalAction(String resourceName, ActionDefinition action);
    
    /**
     * 注册远程 Action 代理
     */
    void registerRemoteAction(String resourceName, RemoteActionProxy proxy);
    
    /**
     * 获取 Action
     */
    ActionDefinition getAction(String resourceName, String actionName);
    
    /**
     * 获取资源下的所有 Actions
     */
    Map<String, ActionDefinition> getResourceActions(String resourceName);
    
    /**
     * 获取所有资源
     */
    Set<String> getResources();
    
    /**
     * 定义资源
     */
    void defineResource(ResourceDefinition resource);
    
    /**
     * 获取资源定义
     */
    ResourceDefinition getResource(String resourceName);
    
    /**
     * 同步到全局注册表
     */
    void syncToGlobal(GlobalActionRegistry globalRegistry);
}
```

### 3.3 注解驱动的 Action 注册

```java
/**
 * 标记类为 Action 资源
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Component
public @interface ActionResource {
    /**
     * 资源名称
     */
    String value();
    
    /**
     * 服务名称（默认当前服务）
     */
    String service() default "";
    
    /**
     * 描述
     */
    String description() default "";
}

/**
 * 标记方法为 Action 处理器
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Action {
    /**
     * Action 名称
     */
    String value();
    
    /**
     * 显示名称
     */
    String title() default "";
    
    /**
     * 描述
     */
    String description() default "";
    
    /**
     * 是否公开访问（无需认证）
     */
    boolean publicAccess() default false;
    
    /**
     * 是否异步执行
     */
    boolean async() default false;
    
    /**
     * 超时时间（毫秒）
     */
    long timeout() default 30000L;
}

/**
 * Action 参数注解
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface ActionParam {
    /**
     * 参数名
     */
    String value();
    
    /**
     * 是否必需
     */
    boolean required() default true;
    
    /**
     * 默认值
     */
    String defaultValue() default "";
    
    /**
     * 参数描述
     */
    String description() default "";
}
```

---

## 4. 标准 Action 格式 / Metadata Schema

### 4.1 Action Metadata 定义

```java
/**
 * Action 元数据
 * 描述 Action 的输入输出规范
 */
@Data
@Builder
public class ActionMetadata {
    
    /**
     * Action 版本
     */
    private String version;
    
    /**
     * 输入参数 Schema
     */
    private ParameterSchema inputSchema;
    
    /**
     * 输出结果 Schema
     */
    private ResultSchema outputSchema;
    
    /**
     * 错误码定义
     */
    private List<ErrorCodeDefinition> errorCodes;
    
    /**
     * 支持的 Content-Type
     */
    private List<String> contentTypes;
    
    /**
     * HTTP 方法映射（用于 HTTP 网关）
     */
    private HttpMapping httpMapping;
    
    /**
     * 权限要求
     */
    private PermissionRequirement permission;
    
    /**
     * 示例数据
     */
    private ActionExamples examples;
}

/**
 * 参数 Schema
 */
@Data
@Builder
public class ParameterSchema {
    
    /**
     * 参数类型: object, array, string, number, boolean
     */
    private String type;
    
    /**
     * 参数属性定义（type=object 时使用）
     */
    private Map<String, ParameterProperty> properties;
    
    /**
     * 必需参数列表
     */
    private List<String> required;
    
    /**
     * 数组元素类型（type=array 时使用）
     */
    private ParameterProperty items;
    
    /**
     * 分页参数
     */
    private PaginationSchema pagination;
    
    /**
     * 过滤参数
     */
    private FilterSchema filter;
}

/**
 * 参数属性
 */
@Data
@Builder
public class ParameterProperty {
    
    /**
     * 属性类型
     */
    private String type;
    
    /**
     * 属性描述
     */
    private String description;
    
    /**
     * 是否必需
     */
    private boolean required;
    
    /**
     * 默认值
     */
    private Object defaultValue;
    
    /**
     * 枚举值
     */
    private List<Object> enumValues;
    
    /**
     * 验证规则
     */
    private ValidationRule validation;
    
    /**
     * 嵌套属性（type=object 时使用）
     */
    private Map<String, ParameterProperty> properties;
}

/**
 * 分页 Schema
 */
@Data
@Builder
public class PaginationSchema {
    
    /**
     * 是否支持分页
     */
    private boolean enabled;
    
    /**
     * 默认页码
     */
    private int defaultPage;
    
    /**
     * 默认每页大小
     */
    private int defaultPageSize;
    
    /**
     * 最大每页大小
     */
    private int maxPageSize;
}

/**
 * 过滤 Schema
 */
@Data
@Builder
public class FilterSchema {
    
    /**
     * 是否支持过滤
     */
    private boolean enabled;
    
    /**
     * 支持的过滤字段
     */
    private Map<String, FilterField> fields;
    
    /**
     * 支持的过滤操作符
     */
    private List<String> operators;
}

/**
 * 结果 Schema
 */
@Data
@Builder
public class ResultSchema {
    
    /**
     * 结果类型
     */
    private String type;
    
    /**
     * 结果属性
     */
    private Map<String, ParameterProperty> properties;
    
    /**
     * 包装格式
     */
    private ResultWrapper wrapper;
}

/**
 * 结果包装器
 */
@Data
@Builder
public class ResultWrapper {
    
    /**
     * 是否包装
     */
    private boolean enabled;
    
    /**
     * 数据字段名
     */
    private String dataField;
    
    /**
     * 状态码字段名
     */
    private String codeField;
    
    /**
     * 消息字段名
     */
    private String messageField;
}
```

### 4.2 JSON Schema 示例

```json
{
  "action": "user:create",
  "version": "1.0.0",
  "title": "创建用户",
  "description": "创建一个新用户",
  "metadata": {
    "inputSchema": {
      "type": "object",
      "properties": {
        "username": {
          "type": "string",
          "description": "用户名",
          "required": true,
          "validation": {
            "minLength": 3,
            "maxLength": 50,
            "pattern": "^[a-zA-Z0-9_]+$"
          }
        },
        "email": {
          "type": "string",
          "description": "邮箱",
          "required": true,
          "validation": {
            "format": "email"
          }
        },
        "role": {
          "type": "string",
          "description": "角色",
          "defaultValue": "user",
          "enumValues": ["user", "admin", "guest"]
        }
      },
      "required": ["username", "email"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "用户ID"
        },
        "username": {
          "type": "string"
        },
        "email": {
          "type": "string"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "errorCodes": [
      {
        "code": "USER_EXISTS",
        "message": "用户已存在",
        "httpStatus": 409
      },
      {
        "code": "INVALID_EMAIL",
        "message": "邮箱格式不正确",
        "httpStatus": 400
      }
    ],
    "httpMapping": {
      "method": "POST",
      "path": "/api/users"
    }
  }
}
```

---

## 5. 微服务远程调用设计

### 5.1 远程 Action 代理

```java
/**
 * 远程 Action 代理
 * 封装远程服务调用的细节
 */
public interface RemoteActionProxy extends ActionHandler {
    
    /**
     * 获取目标服务名称
     */
    String getTargetService();
    
    /**
     * 获取目标 Action 名称
     */
    String getTargetAction();
    
    /**
     * 获取远程端点
     */
    String getEndpoint();
    
    /**
     * 健康检查
     */
    boolean healthCheck();
    
    /**
     * 获取负载均衡策略
     */
    LoadBalanceStrategy getLoadBalanceStrategy();
}

/**
 * 远程 Action 代理实现（基于 HTTP）
 */
@Component
public class HttpRemoteActionProxy implements RemoteActionProxy {
    
    private final String serviceName;
    private final String actionName;
    private final String endpoint;
    private final RestTemplate restTemplate;
    private final LoadBalanceStrategy loadBalanceStrategy;
    
    @Override
    public Object execute(ActionContext context) throws ActionException {
        try {
            // 构建请求
            RemoteActionRequest request = buildRequest(context);
            
            // 选择服务实例
            ServiceInstance instance = loadBalanceStrategy.select(serviceName);
            
            // 发送请求
            String url = buildUrl(instance, endpoint);
            ResponseEntity<RemoteActionResponse> response = restTemplate.postForEntity(
                url, 
                request, 
                RemoteActionResponse.class
            );
            
            // 处理响应
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody().getData();
            } else {
                throw new RemoteActionException(
                    serviceName, 
                    actionName, 
                    response.getBody().getErrorCode(),
                    response.getBody().getErrorMessage()
                );
            }
        } catch (Exception e) {
            throw new RemoteActionException(serviceName, actionName, e);
        }
    }
}

/**
 * 远程 Action 调用器（基于 gRPC）
 */
@Component
public class GrpcRemoteActionProxy implements RemoteActionProxy {
    
    private final ActionServiceGrpc.ActionServiceBlockingStub stub;
    
    @Override
    public Object execute(ActionContext context) throws ActionException {
        try {
            ActionRequest request = ActionRequest.newBuilder()
                .setActionName(context.getAction().getName())
                .setParams(JsonUtils.toJson(context.getParams()))
                .setRequestId(context.getRequestId())
                .build();
            
            ActionResponse response = stub.execute(request);
            
            if (response.getSuccess()) {
                return JsonUtils.fromJson(response.getData());
            } else {
                throw new RemoteActionException(
                    serviceName,
                    actionName,
                    response.getErrorCode(),
                    response.getErrorMessage()
                );
            }
        } catch (StatusRuntimeException e) {
            throw new RemoteActionException(serviceName, actionName, e);
        }
    }
}
```

### 5.2 服务注册与发现

```java
/**
 * 服务注册器
 */
public interface ServiceRegistry {
    
    /**
     * 注册服务
     */
    void register(ServiceInstance instance);
    
    /**
     * 注销服务
     */
    void deregister(String serviceName, String instanceId);
    
    /**
     * 发现服务
     */
    List<ServiceInstance> discover(String serviceName);
    
    /**
     * 监听服务变更
     */
    void subscribe(String serviceName, ServiceChangeListener listener);
}

/**
 * 服务实例
 */
@Data
@Builder
public class ServiceInstance {
    private String serviceName;
    private String instanceId;
    private String host;
    private int port;
    private Map<String, String> metadata;
    private Map<String, ActionDefinition> actions;
    private long registerTime;
    private long lastHeartbeatTime;
}

/**
 * Action 服务同步器
 * 将本地 Action 注册到服务中心
 */
@Component
public class ActionServiceSynchronizer {
    
    @Autowired
    private ServiceActionRegistry localRegistry;
    
    @Autowired
    private ServiceRegistry serviceRegistry;
    
    @Autowired
    private GlobalActionRegistry globalRegistry;
    
    /**
     * 启动时同步
     */
    @PostConstruct
    public void syncOnStartup() {
        // 1. 获取所有本地 Action
        Map<String, ActionDefinition> actions = localRegistry.getAllActions();
        
        // 2. 注册到全局注册表
        actions.values().forEach(globalRegistry::registerAction);
        
        // 3. 注册服务实例
        ServiceInstance instance = buildServiceInstance(actions);
        serviceRegistry.register(instance);
        
        // 4. 监听远程服务
        serviceRegistry.subscribe("*", this::onRemoteServiceChange);
    }
    
    /**
     * 远程服务变更回调
     */
    private void onRemoteServiceChange(ServiceChangeEvent event) {
        if (event.getType() == ServiceChangeType.ADDED) {
            // 注册远程 Action 代理
            event.getInstance().getActions().forEach((name, action) -> {
                RemoteActionProxy proxy = createRemoteProxy(event.getInstance(), action);
                localRegistry.registerRemoteAction(action.getResourceName(), proxy);
            });
        } else if (event.getType() == ServiceChangeType.REMOVED) {
            // 移除远程 Action 代理
            event.getInstance().getActions().keySet().forEach(localRegistry::unregisterRemoteAction);
        }
    }
}
```

---

## 6. 统一调用方式

### 6.1 Action 执行引擎

```java
/**
 * Action 执行引擎
 * 统一的 Action 调用入口
 */
public interface ActionEngine {
    
    /**
     * 执行 Action
     * @param actionName Action 名称（格式: [service:][resource:]action）
     * @param params 执行参数
     * @return 执行结果
     */
    ActionResult execute(String actionName, Map<String, Object> params);
    
    /**
     * 执行 Action（带上下文）
     */
    ActionResult execute(String actionName, ActionContext context);
    
    /**
     * 执行资源 Action
     */
    ActionResult execute(String serviceName, String resourceName, String actionName, 
                         Map<String, Object> params);
    
    /**
     * 异步执行
     */
    CompletableFuture<ActionResult> executeAsync(String actionName, Map<String, Object> params);
    
    /**
     * 批量执行
     */
    List<ActionResult> executeBatch(List<ActionRequest> requests);
    
    /**
     * 执行链（Pipeline）
     */
    ActionResult executePipeline(ActionPipeline pipeline);
}

/**
 * Action 执行引擎实现
 */
@Component
public class DefaultActionEngine implements ActionEngine {
    
    @Autowired
    private GlobalActionRegistry registry;
    
    @Autowired
    private ActionContextFactory contextFactory;
    
    @Autowired
    private List<ActionInterceptor> interceptors;
    
    @Override
    public ActionResult execute(String actionName, Map<String, Object> params) {
        // 1. 查找 Action 定义
        ActionDefinition action = registry.getAction(actionName);
        if (action == null) {
            throw new ActionNotFoundException(actionName);
        }
        
        // 2. 创建上下文
        ActionContext context = contextFactory.create(action, params);
        
        // 3. 执行拦截器链
        ActionInvocation invocation = new ActionInvocation(action, context, interceptors);
        Object result = invocation.proceed();
        
        // 4. 包装结果
        return ActionResult.success(result);
    }
}

/**
 * Action 调用链
 */
public class ActionInvocation {
    
    private final ActionDefinition action;
    private final ActionContext context;
    private final List<ActionInterceptor> interceptors;
    private int index = -1;
    
    public Object proceed() throws ActionException {
        index++;
        if (index < interceptors.size()) {
            return interceptors.get(index).intercept(this);
        } else {
            return action.getHandler().execute(context);
        }
    }
}

/**
 * Action 拦截器
 */
public interface ActionInterceptor {
    
    /**
     * 拦截 Action 执行
     */
    Object intercept(ActionInvocation invocation) throws ActionException;
    
    /**
     * 优先级（数字越小优先级越高）
     */
    default int getOrder() {
        return 0;
    }
}
```

### 6.2 HTTP 网关集成

```java
/**
 * Action HTTP 网关
 * 将 HTTP 请求路由到 Action
 */
@RestController
@RequestMapping("/api")
public class ActionGatewayController {
    
    @Autowired
    private ActionEngine actionEngine;
    
    @Autowired
    private GlobalActionRegistry registry;
    
    /**
     * 通用 Action 调用接口
     */
    @RequestMapping(value = "/{service}/{resource}/{action}", method = {GET, POST, PUT, DELETE})
    public ResponseEntity<?> executeAction(
            @PathVariable String service,
            @PathVariable String resource,
            @PathVariable String action,
            @RequestParam Map<String, Object> queryParams,
            @RequestBody(required = false) Map<String, Object> bodyParams,
            HttpServletRequest request) {
        
        // 合并参数
        Map<String, Object> params = new HashMap<>(queryParams);
        if (bodyParams != null) {
            params.putAll(bodyParams);
        }
        
        // 构建 Action 名称
        String actionName = String.format("%s:%s:%s", service, resource, action);
        
        // 执行 Action
        ActionResult result = actionEngine.execute(actionName, params);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Action 发现接口
     */
    @GetMapping("/_actions")
    public ResponseEntity<List<ActionDefinition>> discoverActions(
            @RequestParam(required = false) String service) {
        
        List<ActionDefinition> actions = service == null 
            ? registry.getAllActions()
            : registry.getActionsByService(service);
        
        return ResponseEntity.ok(actions);
    }
    
    /**
     * Action 元数据接口
     */
    @GetMapping("/_actions/{service}/{resource}/{action}")
    public ResponseEntity<ActionMetadata> getActionMetadata(
            @PathVariable String service,
            @PathVariable String resource,
            @PathVariable String action) {
        
        String actionName = String.format("%s:%s:%s", service, resource, action);
        ActionDefinition definition = registry.getAction(actionName);
        
        if (definition == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(definition.getMetadata());
    }
}
```

---

## 7. 使用示例

### 7.1 定义 Action 资源

```java
/**
 * 用户资源
 */
@ActionResource(value = "user", description = "用户管理")
public class UserResource {
    
    @Autowired
    private UserService userService;
    
    /**
     * 创建用户
     */
    @Action(value = "create", title = "创建用户", description = "创建新用户")
    public User createUser(
            @ActionParam(value = "username", description = "用户名") String username,
            @ActionParam(value = "email", description = "邮箱") String email,
            @ActionParam(value = "role", required = false, defaultValue = "user") String role) {
        
        return userService.createUser(username, email, role);
    }
    
    /**
     * 查询用户
     */
    @Action(value = "get", title = "查询用户")
    public User getUser(
            @ActionParam(value = "id", description = "用户ID") String id) {
        
        return userService.findById(id);
    }
    
    /**
     * 用户列表
     */
    @Action(value = "list", title = "用户列表")
    public PageResult<User> listUsers(
            @ActionParam(value = "page", required = false, defaultValue = "1") int page,
            @ActionParam(value = "pageSize", required = false, defaultValue = "20") int pageSize,
            @ActionParam(value = "filter", required = false) Map<String, Object> filter) {
        
        return userService.findUsers(page, pageSize, filter);
    }
    
    /**
     * 更新用户
     */
    @Action(value = "update", title = "更新用户")
    public User updateUser(
            @ActionParam(value = "id") String id,
            @ActionParam(value = "data") Map<String, Object> data) {
        
        return userService.updateUser(id, data);
    }
    
    /**
     * 删除用户
     */
    @Action(value = "delete", title = "删除用户")
    public void deleteUser(
            @ActionParam(value = "id") String id) {
        
        userService.deleteUser(id);
    }
}
```

### 7.2 程序化注册

```java
/**
 * 自定义 Action 注册
 */
@Component
public class CustomActionRegistrar {
    
    @Autowired
    private ServiceActionRegistry registry;
    
    @PostConstruct
    public void register() {
        // 定义 Action
        ActionDefinition action = ActionDefinition.builder()
            .name("custom:process")
            .title("自定义处理")
            .resourceName("custom")
            .serviceName("my-service")
            .metadata(ActionMetadata.builder()
                .inputSchema(ParameterSchema.builder()
                    .type("object")
                    .property("data", ParameterProperty.builder()
                        .type("string")
                        .required(true)
                        .build())
                    .build())
                .build())
            .handler(context -> {
                String data = context.getParam("data");
                // 处理逻辑
                return processData(data);
            })
            .build();
        
        // 注册 Action
        registry.registerLocalAction("custom", action);
    }
}
```

### 7.3 远程调用

```java
/**
 * 远程服务调用示例
 */
@Service
public class OrderService {
    
    @Autowired
    private ActionEngine actionEngine;
    
    public Order createOrder(CreateOrderRequest request) {
        // 调用本地 Action
        ActionResult userResult = actionEngine.execute(
            "user-service:user:get", 
            Map.of("id", request.getUserId())
        );
        
        User user = userResult.getData();
        
        // 调用远程库存服务
        ActionResult inventoryResult = actionEngine.execute(
            "inventory-service:inventory:deduct",
            Map.of(
                "productId", request.getProductId(),
                "quantity", request.getQuantity()
            )
        );
        
        // 创建订单
        return createOrderInternal(request, user);
    }
}
```

---

## 8. 扩展点设计

### 8.1 自定义拦截器

```java
/**
 * 日志拦截器
 */
@Component
public class LoggingInterceptor implements ActionInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(LoggingInterceptor.class);
    
    @Override
    public Object intercept(ActionInvocation invocation) throws ActionException {
        ActionContext context = invocation.getContext();
        String actionName = context.getAction().getName();
        String requestId = context.getRequestId();
        
        long startTime = System.currentTimeMillis();
        logger.info("[{}] Action started: {}", requestId, actionName);
        
        try {
            Object result = invocation.proceed();
            long duration = System.currentTimeMillis() - startTime;
            logger.info("[{}] Action completed: {} in {}ms", requestId, actionName, duration);
            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logger.error("[{}] Action failed: {} after {}ms", requestId, actionName, duration, e);
            throw e;
        }
    }
    
    @Override
    public int getOrder() {
        return Integer.MIN_VALUE; // 最先执行
    }
}

/**
 * 权限拦截器
 */
@Component
public class AuthorizationInterceptor implements ActionInterceptor {
    
    @Autowired
    private PermissionService permissionService;
    
    @Override
    public Object intercept(ActionInvocation invocation) throws ActionException {
        ActionContext context = invocation.getContext();
        ActionDefinition action = context.getAction();
        
        // 检查是否需要认证
        if (!action.getMetadata().getPermission().isPublic()) {
            UserInfo user = context.getCurrentUser();
            if (user == null) {
                throw new UnauthorizedException("Authentication required");
            }
            
            // 检查权限
            if (!permissionService.hasPermission(user, action.getName())) {
                throw new ForbiddenException("Access denied");
            }
        }
        
        return invocation.proceed();
    }
    
    @Override
    public int getOrder() {
        return -100; // 在日志之后，业务之前
    }
}
```

### 8.2 自定义协议支持

```java
/**
 * 自定义协议处理器
 */
public interface ProtocolHandler {
    
    /**
     * 支持的协议名称
     */
    String getProtocol();
    
    /**
     * 执行远程调用
     */
    Object invoke(RemoteActionProxy proxy, ActionContext context);
}

/**
 * Dubbo 协议处理器
 */
@Component
public class DubboProtocolHandler implements ProtocolHandler {
    
    @Autowired
    private DubboReferenceCache referenceCache;
    
    @Override
    public String getProtocol() {
        return "dubbo";
    }
    
    @Override
    public Object invoke(RemoteActionProxy proxy, ActionContext context) {
        // 获取 Dubbo 服务引用
        GenericService service = referenceCache.get(proxy.getTargetService());
        
        // 构建调用参数
        String methodName = proxy.getTargetAction();
        String[] paramTypes = new String[] {"java.lang.String"}; // 根据实际类型
        Object[] args = new Object[] {JsonUtils.toJson(context.getParams())};
        
        // 执行调用
        return service.$invoke(methodName, paramTypes, args);
    }
}
```

---

## 9. 技术选型建议

| 组件 | 推荐方案 | 备选方案 |
|------|---------|---------|
| 服务注册发现 | Nacos | Consul, Eureka |
| 配置中心 | Nacos | Apollo, Spring Cloud Config |
| 远程调用 | OpenFeign + Ribbon | Dubbo, gRPC |
| 网关 | Spring Cloud Gateway | Zuul |
| 监控 | Micrometer + Prometheus | SkyWalking |
| 限流熔断 | Sentinel | Hystrix, Resilience4j |
| 序列化 | Jackson | Fastjson, Protobuf |

---

## 10. 总结

本设计借鉴 NocoBase 的核心思想，构建了一套面向微服务架构的 Java Action 注册机制：

1. **三层注册架构**：全局注册表 + 服务级注册表 + 资源级注册表，支持灵活的 Action 管理和查询
2. **统一调用方式**：通过 ActionEngine 提供统一的 Action 调用入口，屏蔽本地/远程差异
3. **注解驱动开发**：通过 `@ActionResource` 和 `@Action` 注解简化 Action 定义
4. **完整的元数据**：标准化的 ActionMetadata Schema，支持参数验证、权限控制、API 文档生成
5. **可扩展架构**：拦截器机制、协议处理器、负载均衡策略均可自定义扩展
