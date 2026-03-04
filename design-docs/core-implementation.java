/**
 * 核心类实现代码示例
 * 基于 Java 的 Action 注册机制核心实现
 */

// ==================== 1. Action 定义实现 ====================

package com.example.action.core;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class DefaultActionDefinition implements ActionDefinition {
    
    private String name;
    private String title;
    private String description;
    private String resourceName;
    private String serviceName;
    private ActionMetadata metadata;
    private ActionHandler handler;
    
    @Builder.Default
    private boolean remote = false;
    
    private String remoteEndpoint;
    
    @Override
    public String getQualifiedName() {
        if (serviceName != null && !serviceName.isEmpty()) {
            return String.format("%s:%s:%s", serviceName, resourceName, name);
        }
        return String.format("%s:%s", resourceName, name);
    }
}

// ==================== 2. 全局 Action 注册表实现 ====================

package com.example.action.registry;

import com.example.action.core.*;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Component
public class DefaultGlobalActionRegistry implements GlobalActionRegistry {
    
    // 一级索引: actionName -> ActionDefinition
    private final Map<String, ActionDefinition> actionIndex = new ConcurrentHashMap<>();
    
    // 二级索引: serviceName -> resourceName -> actionName
    private final Map<String, Map<String, Map<String, ActionDefinition>>> serviceIndex = new ConcurrentHashMap<>();
    
    // 监听器列表
    private final List<ActionRegistryListener> listeners = new CopyOnWriteArrayList<>();
    
    @Override
    public void registerAction(ActionDefinition action) {
        String qualifiedName = action.getQualifiedName();
        
        // 检查是否已存在
        ActionDefinition existing = actionIndex.get(qualifiedName);
        if (existing != null) {
            System.out.printf("Warning: Action '%s' is already registered and will be overwritten.%n", qualifiedName);
        }
        
        // 注册到主索引
        actionIndex.put(qualifiedName, action);
        
        // 注册到服务索引
        serviceIndex
            .computeIfAbsent(action.getServiceName(), k -> new ConcurrentHashMap<>())
            .computeIfAbsent(action.getResourceName(), k -> new ConcurrentHashMap<>())
            .put(action.getName(), action);
        
        // 通知监听器
        notifyListeners(new RegistryEvent(RegistryEventType.REGISTERED, action, existing));
    }
    
    @Override
    public void registerActions(String serviceName, Map<String, ActionDefinition> actions) {
        actions.values().forEach(this::registerAction);
    }
    
    @Override
    public void unregisterAction(String actionName) {
        ActionDefinition action = actionIndex.remove(actionName);
        if (action != null) {
            // 从服务索引移除
            Map<String, Map<String, ActionDefinition>> resources = serviceIndex.get(action.getServiceName());
            if (resources != null) {
                Map<String, ActionDefinition> actions = resources.get(action.getResourceName());
                if (actions != null) {
                    actions.remove(action.getName());
                }
            }
            
            notifyListeners(new RegistryEvent(RegistryEventType.UNREGISTERED, null, action));
        }
    }
    
    @Override
    public ActionDefinition getAction(String actionName) {
        return actionIndex.get(actionName);
    }
    
    @Override
    public ActionDefinition getAction(String serviceName, String resourceName, String actionName) {
        Map<String, Map<String, ActionDefinition>> resources = serviceIndex.get(serviceName);
        if (resources == null) return null;
        
        Map<String, ActionDefinition> actions = resources.get(resourceName);
        if (actions == null) return null;
        
        return actions.get(actionName);
    }
    
    @Override
    public List<ActionDefinition> getAllActions() {
        return new ArrayList<>(actionIndex.values());
    }
    
    @Override
    public List<ActionDefinition> getActionsByService(String serviceName) {
        Map<String, Map<String, ActionDefinition>> resources = serviceIndex.get(serviceName);
        if (resources == null) return Collections.emptyList();
        
        return resources.values().stream()
            .flatMap(m -> m.values().stream())
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ActionDefinition> getActionsByResource(String serviceName, String resourceName) {
        Map<String, Map<String, ActionDefinition>> resources = serviceIndex.get(serviceName);
        if (resources == null) return Collections.emptyList();
        
        Map<String, ActionDefinition> actions = resources.get(resourceName);
        if (actions == null) return Collections.emptyList();
        
        return new ArrayList<>(actions.values());
    }
    
    @Override
    public boolean hasAction(String actionName) {
        return actionIndex.containsKey(actionName);
    }
    
    @Override
    public void addRegistryListener(ActionRegistryListener listener) {
        listeners.add(listener);
    }
    
    @Override
    public void removeRegistryListener(ActionRegistryListener listener) {
        listeners.remove(listener);
    }
    
    private void notifyListeners(RegistryEvent event) {
        listeners.forEach(listener -> {
            try {
                listener.onRegistryChange(event);
            } catch (Exception e) {
                System.err.println("Error notifying registry listener: " + e.getMessage());
            }
        });
    }
}

// ==================== 3. Action 上下文实现 ====================

package com.example.action.core;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class DefaultActionContext implements ActionContext {
    
    private final String requestId;
    private final ActionDefinition action;
    private final ActionParams params;
    private final UserInfo currentUser;
    private final Map<String, String> headers;
    private final Map<String, Object> attributes;
    private final ServiceLocator serviceLocator;
    
    private Object result;
    
    public DefaultActionContext(String requestId, ActionDefinition action, 
                                 ActionParams params, UserInfo currentUser,
                                 Map<String, String> headers, ServiceLocator serviceLocator) {
        this.requestId = requestId;
        this.action = action;
        this.params = params;
        this.currentUser = currentUser;
        this.headers = new HashMap<>(headers);
        this.attributes = new ConcurrentHashMap<>();
        this.serviceLocator = serviceLocator;
    }
    
    @Override
    public ActionDefinition getAction() {
        return action;
    }
    
    @Override
    public ActionParams getParams() {
        return params;
    }
    
    @Override
    public void setParam(String key, Object value) {
        params.set(key, value);
    }
    
    @Override
    @SuppressWarnings("unchecked")
    public <T> T getParam(String key) {
        return (T) params.get(key);
    }
    
    @Override
    public UserInfo getCurrentUser() {
        return currentUser;
    }
    
    @Override
    public Map<String, String> getHeaders() {
        return Collections.unmodifiableMap(headers);
    }
    
    @Override
    public void setResult(Object result) {
        this.result = result;
    }
    
    @Override
    @SuppressWarnings("unchecked")
    public <T> T getResult() {
        return (T) result;
    }
    
    @Override
    @SuppressWarnings("unchecked")
    public <T> T getAttribute(String key) {
        return (T) attributes.get(key);
    }
    
    @Override
    public void setAttribute(String key, Object value) {
        attributes.put(key, value);
    }
    
    @Override
    public <T> T getService(Class<T> serviceClass) {
        return serviceLocator.getService(serviceClass);
    }
    
    @Override
    public String getRequestId() {
        return requestId;
    }
    
    @Override
    public ActionContext createSubContext() {
        DefaultActionContext subContext = new DefaultActionContext(
            requestId + "/sub", action, params, currentUser, headers, serviceLocator
        );
        subContext.attributes.putAll(this.attributes);
        return subContext;
    }
}

// ==================== 4. Action 执行引擎实现 ====================

package com.example.action.engine;

import com.example.action.core.*;
import com.example.action.registry.GlobalActionRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

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
        // 解析 Action 名称
        ActionDefinition action = registry.getAction(actionName);
        if (action == null) {
            throw new ActionNotFoundException(actionName);
        }
        
        // 创建上下文
        ActionContext context = contextFactory.create(action, new DefaultActionParams(params));
        
        // 执行
        return executeInternal(action, context);
    }
    
    @Override
    public ActionResult execute(String actionName, ActionContext context) {
        ActionDefinition action = registry.getAction(actionName);
        if (action == null) {
            throw new ActionNotFoundException(actionName);
        }
        return executeInternal(action, context);
    }
    
    @Override
    public ActionResult execute(String serviceName, String resourceName, String actionName, 
                                Map<String, Object> params) {
        ActionDefinition action = registry.getAction(serviceName, resourceName, actionName);
        if (action == null) {
            String qualifiedName = String.format("%s:%s:%s", serviceName, resourceName, actionName);
            throw new ActionNotFoundException(qualifiedName);
        }
        
        ActionContext context = contextFactory.create(action, new DefaultActionParams(params));
        return executeInternal(action, context);
    }
    
    @Override
    public CompletableFuture<ActionResult> executeAsync(String actionName, Map<String, Object> params) {
        return CompletableFuture.supplyAsync(() -> execute(actionName, params));
    }
    
    @Override
    public List<ActionResult> executeBatch(List<ActionRequest> requests) {
        return requests.stream()
            .map(req -> execute(req.getActionName(), req.getParams()))
            .collect(Collectors.toList());
    }
    
    @Override
    public ActionResult executePipeline(ActionPipeline pipeline) {
        Object currentData = null;
        
        for (PipelineStep step : pipeline.getSteps()) {
            Map<String, Object> params = new HashMap<>(step.getParams());
            
            // 注入上一步结果
            if (currentData != null && step.isInjectPreviousResult()) {
                params.put(step.getPreviousResultKey(), currentData);
            }
            
            ActionResult result = execute(step.getActionName(), params);
            
            if (!result.isSuccess()) {
                return result; // 管道中断
            }
            
            currentData = result.getData();
        }
        
        return ActionResult.success(currentData);
    }
    
    private ActionResult executeInternal(ActionDefinition action, ActionContext context) {
        try {
            // 排序拦截器
            List<ActionInterceptor> sortedInterceptors = interceptors.stream()
                .sorted(Comparator.comparingInt(ActionInterceptor::getOrder))
                .collect(Collectors.toList());
            
            // 创建调用链
            ActionInvocation invocation = new ActionInvocation(action, context, sortedInterceptors);
            Object result = invocation.proceed();
            
            return ActionResult.success(result);
        } catch (ActionException e) {
            return ActionResult.error(e.getErrorCode(), e.getMessage());
        } catch (Exception e) {
            return ActionResult.error("INTERNAL_ERROR", e.getMessage());
        }
    }
}

// ==================== 5. Action 调用链实现 ====================

package com.example.action.engine;

import com.example.action.core.*;
import java.util.List;

public class ActionInvocation {
    
    private final ActionDefinition action;
    private final ActionContext context;
    private final List<ActionInterceptor> interceptors;
    private int index = -1;
    
    public ActionInvocation(ActionDefinition action, ActionContext context, 
                           List<ActionInterceptor> interceptors) {
        this.action = action;
        this.context = context;
        this.interceptors = interceptors;
    }
    
    public Object proceed() throws ActionException {
        index++;
        if (index < interceptors.size()) {
            return interceptors.get(index).intercept(this);
        } else {
            // 执行实际的 Action 处理器
            return action.getHandler().execute(context);
        }
    }
    
    public ActionContext getContext() {
        return context;
    }
    
    public ActionDefinition getAction() {
        return action;
    }
}

// ==================== 6. 注解驱动的 Action 扫描器 ====================

package com.example.action.scanner;

import com.example.action.annotation.Action;
import com.example.action.annotation.ActionParam;
import com.example.action.annotation.ActionResource;
import com.example.action.core.*;
import com.example.action.registry.ServiceActionRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.MethodIntrospector;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.*;

@Component
public class ActionAnnotationScanner {
    
    @Autowired
    private ApplicationContext applicationContext;
    
    @Autowired
    private ServiceActionRegistry registry;
    
    @PostConstruct
    public void scan() {
        // 获取所有带有 @ActionResource 注解的 Bean
        Map<String, Object> resourceBeans = applicationContext.getBeansWithAnnotation(ActionResource.class);
        
        for (Object bean : resourceBeans.values()) {
            scanResource(bean);
        }
    }
    
    private void scanResource(Object bean) {
        Class<?> clazz = bean.getClass();
        ActionResource resourceAnnotation = AnnotatedElementUtils.findMergedAnnotation(clazz, ActionResource.class);
        
        if (resourceAnnotation == null) return;
        
        String resourceName = resourceAnnotation.value();
        String serviceName = resourceAnnotation.service();
        if (serviceName.isEmpty()) {
            serviceName = getDefaultServiceName();
        }
        
        // 扫描所有 Action 方法
        Map<Method, Action> annotatedMethods = MethodIntrospector.selectMethods(clazz,
            (MethodIntrospector.MetadataLookup<Action>) method -> 
                AnnotatedElementUtils.findMergedAnnotation(method, Action.class));
        
        for (Map.Entry<Method, Action> entry : annotatedMethods.entrySet()) {
            Method method = entry.getKey();
            Action actionAnnotation = entry.getValue();
            
            ActionDefinition action = buildActionDefinition(
                serviceName, resourceName, actionAnnotation, method, bean);
            
            registry.registerLocalAction(resourceName, action);
        }
    }
    
    private ActionDefinition buildActionDefinition(String serviceName, String resourceName,
                                                    Action actionAnnotation, Method method, Object target) {
        
        // 构建元数据
        ActionMetadata metadata = buildMetadata(method);
        
        // 构建处理器
        ActionHandler handler = context -> {
            // 解析参数
            Object[] args = resolveMethodArgs(method, context);
            
            // 调用方法
            try {
                return method.invoke(target, args);
            } catch (Exception e) {
                throw new ActionExecutionException("Action execution failed", e);
            }
        };
        
        return DefaultActionDefinition.builder()
            .name(actionAnnotation.value())
            .title(actionAnnotation.title())
            .description(actionAnnotation.description())
            .resourceName(resourceName)
            .serviceName(serviceName)
            .metadata(metadata)
            .handler(handler)
            .remote(false)
            .build();
    }
    
    private Object[] resolveMethodArgs(Method method, ActionContext context) {
        Parameter[] parameters = method.getParameters();
        Object[] args = new Object[parameters.length];
        
        for (int i = 0; i < parameters.length; i++) {
            Parameter param = parameters[i];
            ActionParam paramAnnotation = param.getAnnotation(ActionParam.class);
            
            if (paramAnnotation != null) {
                String paramName = paramAnnotation.value();
                Object value = context.getParam(paramName);
                
                if (value == null && paramAnnotation.required() && 
                    !paramAnnotation.defaultValue().isEmpty()) {
                    value = convertValue(paramAnnotation.defaultValue(), param.getType());
                }
                
                args[i] = convertValue(value, param.getType());
            } else if (param.getType().isAssignableFrom(ActionContext.class)) {
                args[i] = context;
            }
        }
        
        return args;
    }
    
    private Object convertValue(Object value, Class<?> targetType) {
        if (value == null) return null;
        // 类型转换逻辑（使用 Spring ConversionService 或手动转换）
        return value;
    }
    
    private ActionMetadata buildMetadata(Method method) {
        // 构建参数 Schema
        ParameterSchema inputSchema = buildInputSchema(method);
        
        // 构建输出 Schema
        ResultSchema outputSchema = buildOutputSchema(method);
        
        return ActionMetadata.builder()
            .inputSchema(inputSchema)
            .outputSchema(outputSchema)
            .version("1.0.0")
            .build();
    }
    
    private String getDefaultServiceName() {
        // 从配置读取默认服务名
        return "default-service";
    }
}

// ==================== 7. HTTP 远程代理实现 ====================

package com.example.action.remote;

import com.example.action.core.*;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class HttpRemoteActionProxy implements RemoteActionProxy {
    
    private final String targetService;
    private final String targetAction;
    private final String endpoint;
    private final RestTemplate restTemplate;
    private final LoadBalanceStrategy loadBalanceStrategy;
    
    public HttpRemoteActionProxy(String targetService, String targetAction, String endpoint,
                                  RestTemplate restTemplate, LoadBalanceStrategy loadBalanceStrategy) {
        this.targetService = targetService;
        this.targetAction = targetAction;
        this.endpoint = endpoint;
        this.restTemplate = restTemplate;
        this.loadBalanceStrategy = loadBalanceStrategy;
    }
    
    @Override
    public Object execute(ActionContext context) throws ActionException {
        try {
            // 构建请求
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Request-Id", context.getRequestId());
            
            // 复制原始请求头
            context.getHeaders().forEach(headers::set);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(
                context.getParams().toMap(), headers);
            
            // 选择服务实例
            ServiceInstance instance = loadBalanceStrategy.select(targetService);
            String url = String.format("http://%s:%d%s", instance.getHost(), instance.getPort(), endpoint);
            
            // 发送请求
            ResponseEntity<RemoteActionResponse> response = restTemplate.postForEntity(
                url, request, RemoteActionResponse.class);
            
            // 处理响应
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                RemoteActionResponse body = response.getBody();
                if (body.isSuccess()) {
                    return body.getData();
                } else {
                    throw new RemoteActionException(targetService, targetAction, 
                        body.getErrorCode(), body.getErrorMessage());
                }
            } else {
                throw new RemoteActionException(targetService, targetAction,
                    "REMOTE_ERROR", "Remote service returned: " + response.getStatusCode());
            }
        } catch (Exception e) {
            if (e instanceof ActionException) {
                throw (ActionException) e;
            }
            throw new RemoteActionException(targetService, targetAction, e);
        }
    }
    
    @Override
    public String getTargetService() {
        return targetService;
    }
    
    @Override
    public String getTargetAction() {
        return targetAction;
    }
    
    @Override
    public String getEndpoint() {
        return endpoint;
    }
    
    @Override
    public boolean healthCheck() {
        try {
            ServiceInstance instance = loadBalanceStrategy.select(targetService);
            String healthUrl = String.format("http://%s:%d/actuator/health", 
                instance.getHost(), instance.getPort());
            ResponseEntity<String> response = restTemplate.getForEntity(healthUrl, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
    
    @Override
    public LoadBalanceStrategy getLoadBalanceStrategy() {
        return loadBalanceStrategy;
    }
}

// ==================== 8. 辅助类和异常定义 ====================

// Action 参数实现
@Data
class DefaultActionParams implements ActionParams {
    private final Map<String, Object> params;
    
    public DefaultActionParams(Map<String, Object> params) {
        this.params = new HashMap<>(params);
    }
    
    @Override
    public Object get(String key) {
        return params.get(key);
    }
    
    @Override
    public void set(String key, Object value) {
        params.put(key, value);
    }
    
    @Override
    public Map<String, Object> toMap() {
        return new HashMap<>(params);
    }
}

// Action 结果实现
@Data
@AllArgsConstructor
class DefaultActionResult implements ActionResult {
    private final boolean success;
    private final Object data;
    private final String errorCode;
    private final String errorMessage;
    private final long timestamp;
    
    public static ActionResult success(Object data) {
        return new DefaultActionResult(true, data, null, null, System.currentTimeMillis());
    }
    
    public static ActionResult error(String errorCode, String errorMessage) {
        return new DefaultActionResult(false, null, errorCode, errorMessage, System.currentTimeMillis());
    }
}

// 异常定义
class ActionException extends RuntimeException {
    private final String errorCode;
    
    public ActionException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}

class ActionNotFoundException extends ActionException {
    public ActionNotFoundException(String actionName) {
        super("ACTION_NOT_FOUND", "Action not found: " + actionName);
    }
}

class RemoteActionException extends ActionException {
    public RemoteActionException(String service, String action, String errorCode, String message) {
        super(errorCode, String.format("Remote action failed [%s:%s]: %s", service, action, message));
    }
    
    public RemoteActionException(String service, String action, Throwable cause) {
        super("REMOTE_ERROR", String.format("Remote action failed [%s:%s]: %s", 
            service, action, cause.getMessage()));
    }
}

class ActionExecutionException extends ActionException {
    public ActionExecutionException(String message, Throwable cause) {
        super("EXECUTION_ERROR", message);
    }
}

// 远程响应
@Data
class RemoteActionResponse {
    private boolean success;
    private Object data;
    private String errorCode;
    private String errorMessage;
}
