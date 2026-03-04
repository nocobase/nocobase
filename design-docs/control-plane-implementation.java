/**
 * Action 控制面服务实现
 * Action Registry Service - 独立的控制面服务
 */

// ==================== 1. 控制面服务入口 ====================

package com.example.action.controlplane;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.action.controlplane")
public class ActionRegistryServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(ActionRegistryServiceApplication.class, args);
    }
}

// ==================== 2. 核心领域模型 ====================

package com.example.action.controlplane.domain;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Action 元数据（领域模型）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionMetadata {
    
    private Long id;
    private String actionKey;           // 完整标识符: namespace.name:version
    private String namespace;           // 命名空间
    private String name;                // Action 名称
    private String version;             // 版本号
    private String fullName;            // namespace.name
    
    // 元数据
    private String title;               // 显示标题
    private String description;         // 描述
    private Map<String, String> labels; // 标签
    private String owner;               // 负责人
    
    // 规范
    private ActionSpec spec;
    
    // 状态
    private ActionState state;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime activatedAt;
    private LocalDateTime deprecatedAt;
    private LocalDateTime disabledAt;
    private LocalDateTime sunsetAt;     // 计划下线时间
    
    // 统计
    private Long totalCalls;
    private Double successRate;
    private Integer avgLatencyMs;
    
    /**
     * 检查是否可以调用
     */
    public boolean isInvocable() {
        return state == ActionState.ACTIVE || state == ActionState.DEPRECATED;
    }
    
    /**
     * 获取语义化版本
     */
    public SemVersion getSemVersion() {
        return SemVersion.parse(version);
    }
}

/**
 * Action 规范
 */
@Data
@Builder
public class ActionSpec {
    private ActionType type;            // SYNC/ASYNC/STREAM
    private Protocol protocol;          // HTTP/GRPC/MQ/DUBBO
    private Endpoint endpoint;          // 服务端点
    private JsonSchema inputSchema;     // 输入 Schema
    private JsonSchema outputSchema;    // 输出 Schema
    private JsonSchema errorSchema;     // 错误 Schema
    private RetryPolicy retryPolicy;    // 重试策略
    private AuthConfig auth;            // 认证配置
    private IdempotencyConfig idempotency; // 幂等配置
    private TenantScope tenantScope;    // 租户范围
}

/**
 * 服务端点
 */
@Data
@Builder
public class Endpoint {
    private String service;             // 服务名
    private String path;                // 路径
    private String method;              // HTTP 方法
    private String topic;               // MQ Topic
    private Integer timeoutMs;          // 超时时间
}

/**
 * 重试策略
 */
@Data
@Builder
public class RetryPolicy {
    private Integer maxAttempts;
    private Integer backoffMs;
    private java.util.List<String> retryableCodes;
}

/**
 * 认证配置
 */
@Data
@Builder
public class AuthConfig {
    private AuthMode mode;
    private java.util.List<String> scopes;
}

/**
 * 幂等配置
 */
@Data
@Builder
public class IdempotencyConfig {
    private Boolean enabled;
    private String keyHeader;
    private Integer ttlSeconds;
}

/**
 * Action 状态
 */
public enum ActionState {
    DRAFT,          // 草稿
    ACTIVE,         // 活跃（可调用）
    DEPRECATED,     // 已弃用（兼容调用）
    DISABLED,       // 已停用
    REMOVED         // 已移除
}

/**
 * Action 类型
 */
public enum ActionType {
    SYNC,           // 同步
    ASYNC,          // 异步
    STREAM          // 流式
}

/**
 * 协议类型
 */
public enum Protocol {
    HTTP, GRPC, MQ, DUBBO
}

/**
 * 认证模式
 */
public enum AuthMode {
    NONE, JWT, MTLS, AKSK
}

/**
 * 租户范围
 */
public enum TenantScope {
    GLOBAL,         // 全局
    TENANT_SPECIFIC // 租户专属
}

/**
 * 语义化版本
 */
@Data
@AllArgsConstructor
public class SemVersion implements Comparable<SemVersion> {
    private final int major;
    private final int minor;
    private final int patch;
    private final String preRelease;
    private final String build;
    
    public static SemVersion parse(String version) {
        // 解析 SemVer: 1.0.0-alpha+build.1
        String[] parts = version.split("\\+");
        String versionPart = parts[0];
        String build = parts.length > 1 ? parts[1] : null;
        
        String[] mainParts = versionPart.split("-");
        String[] numbers = mainParts[0].split("\\.");
        
        return new SemVersion(
            Integer.parseInt(numbers[0]),
            Integer.parseInt(numbers[1]),
            Integer.parseInt(numbers[2]),
            mainParts.length > 1 ? mainParts[1] : null,
            build
        );
    }
    
    @Override
    public int compareTo(SemVersion other) {
        int cmp = Integer.compare(this.major, other.major);
        if (cmp != 0) return cmp;
        
        cmp = Integer.compare(this.minor, other.minor);
        if (cmp != 0) return cmp;
        
        cmp = Integer.compare(this.patch, other.patch);
        if (cmp != 0) return cmp;
        
        // Pre-release 版本号小于正式版本
        if (this.preRelease == null && other.preRelease != null) return 1;
        if (this.preRelease != null && other.preRelease == null) return -1;
        if (this.preRelease != null) {
            return this.preRelease.compareTo(other.preRelease);
        }
        
        return 0;
    }
    
    /**
     * 检查是否与另一版本兼容（同 MAJOR）
     */
    public boolean isCompatibleWith(SemVersion other) {
        return this.major == other.major;
    }
}

// ==================== 3. Repository 层 ====================

package com.example.action.controlplane.repository;

import com.example.action.controlplane.domain.*;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface ActionMetadataRepository {
    
    @Insert("""
        INSERT INTO action_definition (
            action_key, namespace, name, version, full_name,
            title, description, labels_json, owner,
            spec_type, spec_protocol, endpoint_json,
            input_schema_json, output_schema_json, error_schema_json,
            retry_policy_json, auth_json, idempotency_json,
            tenant_scope, tenant_id, state, created_at, updated_at
        ) VALUES (
            #{actionKey}, #{namespace}, #{name}, #{version}, #{fullName},
            #{title}, #{description}, #{labelsJson}, #{owner},
            #{spec.type}, #{spec.protocol}, #{endpointJson},
            #{inputSchemaJson}, #{outputSchemaJson}, #{errorSchemaJson},
            #{retryPolicyJson}, #{authJson}, #{idempotencyJson},
            #{spec.tenantScope}, #{tenantId}, #{state}, NOW(), NOW()
        )
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(ActionMetadataEntity entity);
    
    @Select("SELECT * FROM action_definition WHERE action_key = #{actionKey}")
    ActionMetadataEntity findByKey(String actionKey);
    
    @Select("""
        SELECT * FROM action_definition 
        WHERE namespace = #{namespace} AND name = #{name} AND state = 'ACTIVE'
        ORDER BY major_version DESC, minor_version DESC, patch_version DESC
        LIMIT 1
        """)
    ActionMetadataEntity findLatestActive(@Param("namespace") String namespace, 
                                          @Param("name") String name);
    
    @Select("""
        SELECT * FROM action_definition 
        WHERE namespace = #{namespace} AND name = #{name}
        ORDER BY major_version DESC, minor_version DESC, patch_version DESC
        """)
    List<ActionMetadataEntity> findAllVersions(@Param("namespace") String namespace,
                                               @Param("name") String name);
    
    @Select("<script>" +
        "SELECT * FROM action_definition " +
        "<where>" +
        "  <if test='namespace != null'>AND namespace = #{namespace}</if>" +
        "  <if test='state != null'>AND state = #{state}</if>" +
        "  <if test='type != null'>AND spec_type = #{type}</if>" +
        "  <if test='tenantId != null'>AND tenant_id = #{tenantId}</if>" +
        "</where>" +
        "ORDER BY updated_at DESC" +
        "</script>")
    List<ActionMetadataEntity> query(QueryCondition condition);
    
    @Update("""
        UPDATE action_definition 
        SET state = 'ACTIVE', 
            activated_at = NOW(),
            updated_at = NOW()
        WHERE action_key = #{actionKey}
        """)
    void activate(String actionKey);
    
    @Update("""
        UPDATE action_definition 
        SET state = 'DEPRECATED', 
            deprecated_at = #{deprecatedAt},
            sunset_at = #{sunsetAt},
            updated_at = NOW()
        WHERE action_key = #{actionKey}
        """)
    void deprecate(@Param("actionKey") String actionKey,
                   @Param("deprecatedAt") LocalDateTime deprecatedAt,
                   @Param("sunsetAt") LocalDateTime sunsetAt);
    
    @Update("""
        UPDATE action_definition 
        SET state = 'DISABLED', 
            disabled_at = NOW(),
            updated_at = NOW()
        WHERE action_key = #{actionKey}
        """)
    void disable(String actionKey);
    
    @Update("""
        UPDATE action_definition 
        SET state = 'REMOVED',
            updated_at = NOW()
        WHERE action_key = #{actionKey}
        """)
    void remove(String actionKey);
}

// ==================== 4. Service 层 ====================

package com.example.action.controlplane.service;

import com.example.action.controlplane.domain.*;
import com.example.action.controlplane.dto.*;
import com.example.action.controlplane.repository.*;
import com.example.action.controlplane.event.*;
import com.networknt.schema.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ActionRegistryService {
    
    private final ActionMetadataRepository repository;
    private final ActionAuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final JsonSchemaFactory schemaFactory;
    
    /**
     * 注册 Action
     */
    @Transactional
    public RegisterResult register(RegisterRequest request) {
        // 1. 校验 Schema
        validateSchemas(request);
        
        // 2. 构建 Action Key
        String actionKey = buildActionKey(request.getNamespace(), request.getName(), request.getVersion());
        
        // 3. 检查是否已存在
        ActionMetadataEntity existing = repository.findByKey(actionKey);
        if (existing != null) {
            throw new ActionAlreadyExistsException(actionKey);
        }
        
        // 4. 检查兼容性（如果是小版本更新）
        if (isPatchVersion(request.getVersion())) {
            checkCompatibility(request);
        }
        
        // 5. 持久化
        ActionMetadataEntity entity = convertToEntity(request);
        entity.setActionKey(actionKey);
        entity.setFullName(request.getNamespace() + "." + request.getName());
        entity.setState(ActionState.DRAFT);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        
        repository.insert(entity);
        
        // 6. 审计日志
        saveAuditLog(actionKey, "REGISTER", null, entity, request.getOperator());
        
        // 7. 发布事件
        eventPublisher.publishEvent(new ActionRegisteredEvent(this, actionKey));
        
        return RegisterResult.builder()
            .actionKey(actionKey)
            .state(ActionState.DRAFT)
            .registeredAt(entity.getCreatedAt())
            .build();
    }
    
    /**
     * 激活 Action
     */
    @Transactional
    public void activate(String actionKey, String operator) {
        ActionMetadataEntity entity = repository.findByKey(actionKey);
        if (entity == null) {
            throw new ActionNotFoundException(actionKey);
        }
        
        if (entity.getState() != ActionState.DRAFT && entity.getState() != ActionState.DISABLED) {
            throw new InvalidStateTransitionException("Cannot activate from state: " + entity.getState());
        }
        
        ActionMetadataEntity before = copy(entity);
        repository.activate(actionKey);
        
        saveAuditLog(actionKey, "ACTIVATE", before, repository.findByKey(actionKey), operator);
        eventPublisher.publishEvent(new ActionActivatedEvent(this, actionKey));
    }
    
    /**
     * 弃用 Action
     */
    @Transactional
    public void deprecate(String actionKey, DeprecateRequest request, String operator) {
        ActionMetadataEntity entity = repository.findByKey(actionKey);
        if (entity == null) {
            throw new ActionNotFoundException(actionKey);
        }
        
        if (entity.getState() != ActionState.ACTIVE) {
            throw new InvalidStateTransitionException("Can only deprecate ACTIVE actions");
        }
        
        ActionMetadataEntity before = copy(entity);
        repository.deprecate(actionKey, request.getDeprecatedAt(), request.getSunsetAt());
        
        saveAuditLog(actionKey, "DEPRECATE", before, repository.findByKey(actionKey), operator);
        eventPublisher.publishEvent(new ActionDeprecatedEvent(this, actionKey, request.getMigrationGuide()));
    }
    
    /**
     * 禁用 Action
     */
    @Transactional
    public void disable(String actionKey, String reason, String operator) {
        ActionMetadataEntity entity = repository.findByKey(actionKey);
        if (entity == null) {
            throw new ActionNotFoundException(actionKey);
        }
        
        ActionMetadataEntity before = copy(entity);
        repository.disable(actionKey);
        
        saveAuditLog(actionKey, "DISABLE", before, repository.findByKey(actionKey), operator);
        eventPublisher.publishEvent(new ActionDisabledEvent(this, actionKey, reason));
    }
    
    /**
     * 查询 Action
     */
    public ActionMetadata getAction(String actionKey) {
        ActionMetadataEntity entity = repository.findByKey(actionKey);
        if (entity == null) {
            throw new ActionNotFoundException(actionKey);
        }
        return convertToDomain(entity);
    }
    
    /**
     * 获取最新 ACTIVE 版本
     */
    public ActionMetadata getLatestActive(String namespace, String name) {
        ActionMetadataEntity entity = repository.findLatestActive(namespace, name);
        if (entity == null) {
            throw new ActionNotFoundException(namespace + "." + name);
        }
        return convertToDomain(entity);
    }
    
    /**
     * 搜索 Actions
     */
    public List<ActionMetadata> query(QueryRequest request) {
        QueryCondition condition = new QueryCondition();
        condition.setNamespace(request.getNamespace());
        condition.setState(request.getState());
        condition.setType(request.getType());
        condition.setTenantId(request.getTenantId());
        
        // 处理标签过滤
        if (request.getLabels() != null && !request.getLabels().isEmpty()) {
            condition.setLabelsJson(request.getLabels());
        }
        
        return repository.query(condition).stream()
            .map(this::convertToDomain)
            .toList();
    }
    
    /**
     * 验证输入参数
     */
    public ValidationResult validateInput(String actionKey, JsonNode input) {
        ActionMetadataEntity entity = repository.findByKey(actionKey);
        if (entity == null) {
            throw new ActionNotFoundException(actionKey);
        }
        
        try {
            JsonSchema schema = schemaFactory.getSchema(entity.getInputSchemaJson());
            Set<ValidationMessage> errors = schema.validate(input);
            
            return ValidationResult.builder()
                .valid(errors.isEmpty())
                .errors(errors.stream()
                    .map(e -> new ValidationError(e.getType(), e.getMessage(), e.getProperty()))
                    .toList())
                .build();
        } catch (Exception e) {
            return ValidationResult.builder()
                .valid(false)
                .errors(List.of(new ValidationError("SCHEMA_ERROR", e.getMessage(), null)))
                .build();
        }
    }
    
    /**
     * 检查版本兼容性
     */
    public CompatibilityResult checkCompatibility(String oldKey, String newKey) {
        ActionMetadataEntity oldEntity = repository.findByKey(oldKey);
        ActionMetadataEntity newEntity = repository.findByKey(newKey);
        
        if (oldEntity == null || newEntity == null) {
            throw new ActionNotFoundException(oldKey + " or " + newKey);
        }
        
        // Schema 兼容性检查
        List<BreakingChange> breakingChanges = new ArrayList<>();
        
        // 检查输入 Schema
        JsonSchema oldInput = schemaFactory.getSchema(oldEntity.getInputSchemaJson());
        JsonSchema newInput = schemaFactory.getSchema(newEntity.getInputSchemaJson());
        
        // TODO: 详细的 Schema diff 检查
        
        return CompatibilityResult.builder()
            .compatible(breakingChanges.isEmpty())
            .breakingChanges(breakingChanges)
            .build();
    }
    
    // ========== 私有方法 ==========
    
    private void validateSchemas(RegisterRequest request) {
        try {
            // 验证 inputSchema 是合法的 JSON Schema
            schemaFactory.getSchema(objectMapper.writeValueAsString(request.getInputSchema()));
            schemaFactory.getSchema(objectMapper.writeValueAsString(request.getOutputSchema()));
        } catch (Exception e) {
            throw new InvalidSchemaException("Invalid schema: " + e.getMessage());
        }
    }
    
    private String buildActionKey(String namespace, String name, String version) {
        return String.format("%s.%s:%s", namespace, name, version);
    }
    
    private boolean isPatchVersion(String version) {
        SemVersion semVer = SemVersion.parse(version);
        return semVer.getMinor() > 0 || semVer.getPatch() > 0;
    }
    
    private void saveAuditLog(String actionKey, String operation, 
                             ActionMetadataEntity before, ActionMetadataEntity after,
                             String operator) {
        AuditLogEntity log = new AuditLogEntity();
        log.setActionKey(actionKey);
        log.setOperation(operation);
        log.setOperator(operator);
        log.setBeforeJson(before != null ? toJson(before) : null);
        log.setAfterJson(after != null ? toJson(after) : null);
        log.setCreatedAt(LocalDateTime.now());
        auditLogRepository.insert(log);
    }
    
    private ActionMetadataEntity copy(ActionMetadataEntity entity) {
        // 深拷贝用于审计
        try {
            return objectMapper.readValue(objectMapper.writeValueAsString(entity), 
                                         ActionMetadataEntity.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to copy entity", e);
        }
    }
    
    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}

// ==================== 5. REST API 控制器 ====================

package com.example.action.controlplane.controller;

import com.example.action.controlplane.dto.*;
import com.example.action.controlplane.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/registry")
@RequiredArgsConstructor
public class ActionRegistryController {
    
    private final ActionRegistryService registryService;
    
    /**
     * 注册 Action
     */
    @PostMapping("/actions")
    public ResponseEntity<ApiResponse<RegisterResult>> register(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader("X-Operator") String operator) {
        
        request.setOperator(operator);
        RegisterResult result = registryService.register(request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(result));
    }
    
    /**
     * 获取 Action 元数据
     */
    @GetMapping("/actions/{namespace}.{name}:{version}")
    public ResponseEntity<ApiResponse<ActionMetadataDTO>> getAction(
            @PathVariable String namespace,
            @PathVariable String name,
            @PathVariable String version) {
        
        String actionKey = String.format("%s.%s:%s", namespace, name, version);
        ActionMetadataDTO dto = registryService.getAction(actionKey);
        
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
    
    /**
     * 获取最新 ACTIVE 版本
     */
    @GetMapping("/actions/{namespace}.{name}")
    public ResponseEntity<ApiResponse<ActionMetadataDTO>> getLatestActive(
            @PathVariable String namespace,
            @PathVariable String name) {
        
        ActionMetadataDTO dto = registryService.getLatestActive(namespace, name);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
    
    /**
     * 搜索 Actions
     */
    @GetMapping("/actions")
    public ResponseEntity<ApiResponse<List<ActionMetadataDTO>>> query(
            @RequestParam(required = false) String namespace,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String tenantId) {
        
        QueryRequest request = QueryRequest.builder()
            .namespace(namespace)
            .state(state)
            .type(type)
            .tenantId(tenantId)
            .build();
        
        List<ActionMetadataDTO> results = registryService.query(request);
        return ResponseEntity.ok(ApiResponse.success(results));
    }
    
    /**
     * 激活 Action
     */
    @PostMapping("/actions/{namespace}.{name}:{version}/activate")
    public ResponseEntity<ApiResponse<Void>> activate(
            @PathVariable String namespace,
            @PathVariable String name,
            @PathVariable String version,
            @RequestHeader("X-Operator") String operator) {
        
        String actionKey = String.format("%s.%s:%s", namespace, name, version);
        registryService.activate(actionKey, operator);
        
        return ResponseEntity.ok(ApiResponse.success(null));
    }
    
    /**
     * 弃用 Action
     */
    @PostMapping("/actions/{namespace}.{name}:{version}/deprecate")
    public ResponseEntity<ApiResponse<Void>> deprecate(
            @PathVariable String namespace,
            @PathVariable String name,
            @PathVariable String version,
            @Valid @RequestBody DeprecateRequest request,
            @RequestHeader("X-Operator") String operator) {
        
        String actionKey = String.format("%s.%s:%s", namespace, name, version);
        registryService.deprecate(actionKey, request, operator);
        
        return ResponseEntity.ok(ApiResponse.success(null));
    }
    
    /**
     * 禁用 Action
     */
    @PostMapping("/actions/{namespace}.{name}:{version}/disable")
    public ResponseEntity<ApiResponse<Void>> disable(
            @PathVariable String namespace,
            @PathVariable String name,
            @PathVariable String version,
            @RequestParam String reason,
            @RequestHeader("X-Operator") String operator) {
        
        String actionKey = String.format("%s.%s:%s", namespace, name, version);
        registryService.disable(actionKey, reason, operator);
        
        return ResponseEntity.ok(ApiResponse.success(null));
    }
    
    /**
     * 验证输入参数
     */
    @PostMapping("/actions/{namespace}.{name}:{version}/validate")
    public ResponseEntity<ApiResponse<ValidationResult>> validateInput(
            @PathVariable String namespace,
            @PathVariable String name,
            @PathVariable String version,
            @RequestBody JsonNode input) {
        
        String actionKey = String.format("%s.%s:%s", namespace, name, version);
        ValidationResult result = registryService.validateInput(actionKey, input);
        
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    
    /**
     * 获取所有版本
     */
    @GetMapping("/actions/{namespace}.{name}/versions")
    public ResponseEntity<ApiResponse<List<ActionVersionDTO>>> getVersions(
            @PathVariable String namespace,
            @PathVariable String name) {
        
        List<ActionVersionDTO> versions = registryService.getAllVersions(namespace, name);
        return ResponseEntity.ok(ApiResponse.success(versions));
    }
}

// ==================== 6. 数据面 SDK 集成 ====================

package com.example.action.sdk;

import com.example.action.controlplane.dto.ActionMetadataDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 控制面 Feign 客户端
 * 数据面服务通过此客户端与控制面通信
 */
@FeignClient(
    name = "action-registry",
    url = "${action.registry.server-url}",
    fallbackFactory = ActionRegistryClientFallbackFactory.class
)
public interface ActionRegistryClient {
    
    @GetMapping("/api/v1/registry/actions/{namespace}.{name}:{version}")
    ApiResponse<ActionMetadataDTO> getAction(
        @PathVariable("namespace") String namespace,
        @PathVariable("name") String name,
        @PathVariable("version") String version
    );
    
    @GetMapping("/api/v1/registry/actions/{namespace}.{name}")
    ApiResponse<ActionMetadataDTO> getLatestActive(
        @PathVariable("namespace") String namespace,
        @PathVariable("name") String name
    );
    
    @GetMapping("/api/v1/registry/actions")
    ApiResponse<List<ActionMetadataDTO>> query(
        @RequestParam(required = false) String namespace,
        @RequestParam(required = false) String state
    );
    
    @PostMapping("/api/v1/registry/actions")
    ApiResponse<RegisterResult> register(@RequestBody RegisterRequest request);
    
    @PostMapping("/api/v1/registry/actions/{namespace}.{name}:{version}/activate")
    ApiResponse<Void> activate(
        @PathVariable String namespace,
        @PathVariable String name,
        @PathVariable String version
    );
}
