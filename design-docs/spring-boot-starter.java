/**
 * Spring Boot Starter 自动配置
 * 简化 Action 注册机制的集成
 */

// ==================== 1. 自动配置类 ====================

package com.example.action.starter.config;

import com.example.action.core.*;
import com.example.action.engine.*;
import com.example.action.registry.*;
import com.example.action.remote.*;
import com.example.action.scanner.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableConfigurationProperties(ActionProperties.class)
@Import({
    ActionAnnotationScanner.class,
    ActionGatewayController.class
})
public class ActionAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public GlobalActionRegistry globalActionRegistry() {
        return new DefaultGlobalActionRegistry();
    }
    
    @Bean
    @ConditionalOnMissingBean
    public ServiceActionRegistry serviceActionRegistry(ActionProperties properties,
                                                        GlobalActionRegistry globalRegistry) {
        DefaultServiceActionRegistry registry = new DefaultServiceActionRegistry(properties.getServiceName());
        registry.syncToGlobal(globalRegistry);
        return registry;
    }
    
    @Bean
    @ConditionalOnMissingBean
    public ActionEngine actionEngine() {
        return new DefaultActionEngine();
    }
    
    @Bean
    @ConditionalOnMissingBean
    public ActionContextFactory actionContextFactory() {
        return new DefaultActionContextFactory();
    }
    
    @Bean
    @ConditionalOnMissingBean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    
    @Bean
    @ConditionalOnMissingBean
    public LoadBalanceStrategy loadBalanceStrategy() {
        return new RoundRobinLoadBalanceStrategy();
    }
    
    // 默认拦截器
    @Bean
    public LoggingInterceptor loggingInterceptor() {
        return new LoggingInterceptor();
    }
    
    @Bean
    @ConditionalOnProperty(prefix = "action.security", name = "enabled", havingValue = "true", matchIfMissing = true)
    public AuthorizationInterceptor authorizationInterceptor() {
        return new AuthorizationInterceptor();
    }
    
    @Bean
    @ConditionalOnProperty(prefix = "action.validation", name = "enabled", havingValue = "true", matchIfMissing = true)
    public ValidationInterceptor validationInterceptor() {
        return new ValidationInterceptor();
    }
    
    // 服务同步器（微服务场景）
    @Bean
    @ConditionalOnProperty(prefix = "action.discovery", name = "enabled", havingValue = "true")
    public ActionServiceSynchronizer actionServiceSynchronizer() {
        return new ActionServiceSynchronizer();
    }
}

// ==================== 2. 配置属性 ====================

package com.example.action.starter.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@Data
@ConfigurationProperties(prefix = "action")
public class ActionProperties {
    
    /**
     * 当前服务名称
     */
    private String serviceName = "default-service";
    
    /**
     * 是否启用 Action 网关
     */
    private boolean gatewayEnabled = true;
    
    /**
     * 网关路径前缀
     */
    private String gatewayPath = "/api";
    
    /**
     * 安全配置
     */
    private SecurityConfig security = new SecurityConfig();
    
    /**
     * 验证配置
     */
    private ValidationConfig validation = new ValidationConfig();
    
    /**
     * 服务发现配置
     */
    private DiscoveryConfig discovery = new DiscoveryConfig();
    
    /**
     * 远程调用配置
     */
    private RemoteConfig remote = new RemoteConfig();
    
    @Data
    public static class SecurityConfig {
        private boolean enabled = true;
        private List<String> publicActions = new ArrayList<>();
        private List<String> whitelist = new ArrayList<>();
    }
    
    @Data
    public static class ValidationConfig {
        private boolean enabled = true;
        private boolean strictMode = false;
    }
    
    @Data
    public static class DiscoveryConfig {
        private boolean enabled = false;
        private String registryType = "nacos"; // nacos, consul, eureka
        private String serverAddr = "localhost:8848";
        private long syncInterval = 30000; // 30秒
    }
    
    @Data
    public static class RemoteConfig {
        private String protocol = "http"; // http, grpc, dubbo
        private int timeout = 30000;
        private int retryCount = 3;
        private boolean circuitBreakerEnabled = true;
    }
}

// ==================== 3. 控制器实现 ====================

package com.example.action.starter.config;

import com.example.action.core.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("${action.gateway-path:/api}")
public class ActionGatewayController {
    
    @Autowired
    private ActionEngine actionEngine;
    
    @Autowired
    private GlobalActionRegistry registry;
    
    /**
     * 通用 Action 调用接口
     * 支持格式: /{service}/{resource}/{action}
     */
    @RequestMapping(value = "/{service}/{resource}/{action}", 
                    method = {RequestMethod.GET, RequestMethod.POST, 
                             RequestMethod.PUT, RequestMethod.DELETE})
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
        
        // 提取请求头
        Map<String, String> headers = extractHeaders(request);
        
        // 构建 Action 名称并执行
        String actionName = String.format("%s:%s:%s", service, resource, action);
        
        try {
            ActionResult result = actionEngine.execute(actionName, params);
            
            if (result.isSuccess()) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(400).body(result);
            }
        } catch (ActionNotFoundException e) {
            return ResponseEntity.status(404).body(
                DefaultActionResult.error("ACTION_NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(
                DefaultActionResult.error("INTERNAL_ERROR", e.getMessage()));
        }
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
    
    /**
     * 健康检查
     */
    @GetMapping("/_health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("actionCount", registry.getAllActions().size());
        return ResponseEntity.ok(health);
    }
    
    private Map<String, String> extractHeaders(HttpServletRequest request) {
        Map<String, String> headers = new HashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            headers.put(name, request.getHeader(name));
        }
        return headers;
    }
}

// ==================== 4. 服务级注册表实现 ====================

package com.example.action.registry;

import com.example.action.core.*;
import com.example.action.remote.RemoteActionProxy;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class DefaultServiceActionRegistry implements ServiceActionRegistry {
    
    private final String serviceName;
    private final Map<String, Map<String, ActionDefinition>> resources = new ConcurrentHashMap<>();
    private final Map<String, ResourceDefinition> resourceDefinitions = new ConcurrentHashMap<>();
    
    public DefaultServiceActionRegistry(String serviceName) {
        this.serviceName = serviceName;
    }
    
    @Override
    public String getServiceName() {
        return serviceName;
    }
    
    @Override
    public void registerLocalAction(String resourceName, ActionDefinition action) {
        resources.computeIfAbsent(resourceName, k -> new ConcurrentHashMap<>())
                 .put(action.getName(), action);
    }
    
    @Override
    public void registerRemoteAction(String resourceName, RemoteActionProxy proxy) {
        // 创建代理 Action 定义
        ActionDefinition proxyAction = DefaultActionDefinition.builder()
            .name(proxy.getTargetAction())
            .resourceName(resourceName)
            .serviceName(proxy.getTargetService())
            .handler(proxy)
            .remote(true)
            .remoteEndpoint(proxy.getEndpoint())
            .build();
        
        registerLocalAction(resourceName, proxyAction);
    }
    
    @Override
    public ActionDefinition getAction(String resourceName, String actionName) {
        Map<String, ActionDefinition> actions = resources.get(resourceName);
        return actions != null ? actions.get(actionName) : null;
    }
    
    @Override
    public Map<String, ActionDefinition> getResourceActions(String resourceName) {
        return new HashMap<>(resources.getOrDefault(resourceName, Collections.emptyMap()));
    }
    
    @Override
    public Set<String> getResources() {
        return new HashSet<>(resources.keySet());
    }
    
    @Override
    public void defineResource(ResourceDefinition resource) {
        resourceDefinitions.put(resource.getName(), resource);
    }
    
    @Override
    public ResourceDefinition getResource(String resourceName) {
        return resourceDefinitions.get(resourceName);
    }
    
    @Override
    public void syncToGlobal(GlobalActionRegistry globalRegistry) {
        resources.forEach((resourceName, actions) -> {
            actions.forEach((actionName, action) -> {
                globalRegistry.registerAction(action);
            });
        });
    }
    
    public void unregisterRemoteAction(String actionName) {
        // 移除远程 Action 代理
        resources.values().forEach(actions -> {
            actions.values().removeIf(action -> 
                action.isRemote() && action.getName().equals(actionName));
        });
    }
}

// ==================== 5. 上下文工厂实现 ====================

package com.example.action.core;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class DefaultActionContextFactory implements ActionContextFactory {
    
    private static final AtomicLong REQUEST_ID_GENERATOR = new AtomicLong(0);
    
    @Autowired
    private ServiceLocator serviceLocator;
    
    @Override
    public ActionContext create(ActionDefinition action, ActionParams params) {
        String requestId = generateRequestId();
        UserInfo currentUser = extractCurrentUser();
        Map<String, String> headers = extractHeaders();
        
        return new DefaultActionContext(requestId, action, params, currentUser, headers, serviceLocator);
    }
    
    private String generateRequestId() {
        return System.currentTimeMillis() + "-" + REQUEST_ID_GENERATOR.incrementAndGet();
    }
    
    private UserInfo extractCurrentUser() {
        // 从 SecurityContext 或 Token 中提取用户信息
        // 这里简化处理
        return null;
    }
    
    private Map<String, String> extractHeaders() {
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        
        if (attributes == null) {
            return Collections.emptyMap();
        }
        
        HttpServletRequest request = attributes.getRequest();
        Map<String, String> headers = new HashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            headers.put(name, request.getHeader(name));
        }
        
        return headers;
    }
}

// ==================== 6. 负载均衡策略 ====================

package com.example.action.remote;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 轮询负载均衡策略
 */
public class RoundRobinLoadBalanceStrategy implements LoadBalanceStrategy {
    
    private final AtomicInteger counter = new AtomicInteger(0);
    
    @Override
    public ServiceInstance select(String serviceName) {
        List<ServiceInstance> instances = ServiceInstanceCache.getInstances(serviceName);
        if (instances.isEmpty()) {
            throw new NoAvailableInstanceException("No available instance for service: " + serviceName);
        }
        
        int index = counter.getAndIncrement() % instances.size();
        return instances.get(index);
    }
}

/**
 * 随机负载均衡策略
 */
public class RandomLoadBalanceStrategy implements LoadBalanceStrategy {
    
    private final java.util.Random random = new java.util.Random();
    
    @Override
    public ServiceInstance select(String serviceName) {
        List<ServiceInstance> instances = ServiceInstanceCache.getInstances(serviceName);
        if (instances.isEmpty()) {
            throw new NoAvailableInstanceException("No available instance for service: " + serviceName);
        }
        
        return instances.get(random.nextInt(instances.size()));
    }
}

// ==================== 7. 验证拦截器 ====================

package com.example.action.engine;

import com.example.action.core.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.ValidationMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class ValidationInterceptor implements ActionInterceptor {
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Override
    public Object intercept(ActionInvocation invocation) throws ActionException {
        ActionContext context = invocation.getContext();
        ActionDefinition action = context.getAction();
        ActionMetadata metadata = action.getMetadata();
        
        if (metadata != null && metadata.getInputSchema() != null) {
            // 验证输入参数
            validateParams(context.getParams(), metadata.getInputSchema());
        }
        
        return invocation.proceed();
    }
    
    private void validateParams(ActionParams params, ParameterSchema schema) throws ActionException {
        try {
            // 将 Schema 转换为 JSON Schema 进行验证
            JsonSchema jsonSchema = convertToJsonSchema(schema);
            JsonNode paramsNode = objectMapper.valueToTree(params.toMap());
            
            Set<ValidationMessage> errors = jsonSchema.validate(paramsNode);
            if (!errors.isEmpty()) {
                String errorMsg = String.join(", ", 
                    errors.stream().map(ValidationMessage::getMessage).toArray(String[]::new));
                throw new ActionException("VALIDATION_ERROR", "Parameter validation failed: " + errorMsg);
            }
        } catch (Exception e) {
            if (e instanceof ActionException) {
                throw (ActionException) e;
            }
            throw new ActionException("VALIDATION_ERROR", "Validation error: " + e.getMessage());
        }
    }
    
    private JsonSchema convertToJsonSchema(ParameterSchema schema) {
        // 转换逻辑
        JsonSchemaFactory factory = JsonSchemaFactory.getInstance();
        return factory.getSchema("{}"); // 简化处理
    }
    
    @Override
    public int getOrder() {
        return -50; // 在权限验证之后，业务逻辑之前
    }
}

// ==================== 8. Spring Boot 自动配置加载器 ====================

// META-INF/spring.factories
/*
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.example.action.starter.config.ActionAutoConfiguration
*/

// META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports (Spring Boot 2.7+)
/*
com.example.action.starter.config.ActionAutoConfiguration
*/

// ==================== 9. Maven 依赖示例 ====================

/* pom.xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.18</version>
        <relativePath/>
    </parent>
    
    <groupId>com.example</groupId>
    <artifactId>action-spring-boot-starter</artifactId>
    <version>1.0.0</version>
    
    <dependencies>
        <!-- Spring Boot -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <!-- JSON Schema Validation -->
        <dependency>
            <groupId>com.networknt</groupId>
            <artifactId>json-schema-validator</artifactId>
            <version>1.0.86</version>
        </dependency>
        
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- 微服务相关（可选） -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
            <optional>true</optional>
        </dependency>
        
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- gRPC（可选） -->
        <dependency>
            <groupId>io.grpc</groupId>
            <artifactId>grpc-netty-shaded</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
*/
