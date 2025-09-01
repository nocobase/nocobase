## 流程引擎（服务端）

本插件为流程引擎提供服务端能力，包含一个安全的服务端变量解析器，用于解析 `{{ ctx.* }}` 表达式。

### variables:resolve 接口

- URL：`/api/variables:resolve`
- 方法：POST
- 鉴权：推荐已登录（若启用 ACL，会按权限校验）
- 请求体（两种写法，二选一）：
  - 直接把整个 `values` 当作模板
  - 或将模板放在 `values.template` 下

示例：

1）直接解析整个 `values`

POST /api/variables:resolve
{
  "userId": "{{ ctx.user.id }}",
  "now": "{{ ctx.now }}",
  "unknown": "{{ ctx.notExist }}"
}

响应（无法解析的占位符会被原样保留）：
{
  "data": {
    "userId": 1,
    "now": "2024-08-30T12:34:56.000Z",
    "unknown": "{{ ctx.notExist }}"
  }
}

2）通过 `values.template` 传入模板

POST /api/variables:resolve
{
  "template": { "time": "{{ ctx.timestamp }}" }
}

响应：
{
  "data": { "time": 1725000000000 }
}

服务端 ctx 分层（基类：ServerBaseContext）
- GlobalContext：`now`、`timestamp`、`env`
- HttpRequestContext：`user`、`roleName`、`locale`、`ip`、`headers`、`query`、`params`、`record`
- 两者均继承同一基础上下文，支持通过 `ctx.defineMethod(name, fn)` 挂载可调用方法，例如 `{{ ctx.formatDate(ctx.now) }}`。

记录上下文参数（contextParams）
- 当模板中引用 `{{ ctx.record ... }}` 时，需要传入 `contextParams.record`：

POST /api/variables:resolve
{
  "template": {
    "id": "{{ ctx.record.id }}"
  },
  "contextParams": {
    "record": {
      "dataSourceKey": "main",            // 可选，默认 'main'
      "collection": "users",               // 必填
      "filterByTk": 1,                      // 必填
      "fields": ["id"],                    // 可选
      "appends": ["roles"]                 // 可选，加载关联便于访问嵌套字段
    }
  }
}

若缺少必填参数，接口会返回 400：
{
  "error": {
    "code": "INVALID_CONTEXT_PARAMS",
    "message": "Missing required parameters: contextParams.record.collection, contextParams.record.filterByTk",
    "missing": ["contextParams.record.collection", "contextParams.record.filterByTk"]
  }
}

注意事项
- 解析器在 SES 沙箱中执行表达式，沙箱仅赋予最小化的白名单全局对象。
- 支持路径读取与基础运算（如 `{{ ctx.user.id + 1 }}`、`{{ ctx.record.roles[0].name }}`），也支持顶级括号变量写法 `{{ ctx["record"].id }}`。
- 仅允许访问白名单中的 ctx 属性；无法解析或不支持的表达式会被原样保留。
- `env` 仅暴露公共前缀（PUBLIC_、NEXT_PUBLIC_、NCB_PUBLIC_），避免泄露敏感配置。

记录（record）校验
- `variables:resolve` 不假设任何隐式资源上下文。当引用 `ctx.record.*` 时，必须提供 `contextParams.record` 的必填字段（`collection`、`filterByTk`），否则返回 400。

路径书写（用于推断 fields/appends）
- 建议使用点语法作为首段，例如：`{{ ctx.record.roles[0].name }}`。
- 支持属性首段的括号写法：`{{ ctx.record["roles"][0].name }}`，会被标准化用于自动推断 `appends: ["roles"]`。
- 支持顶级括号变量：`{{ ctx["record"]["roles"][0].name }}`。
- 以纯数字作为首段（如 `ctx.record[0].x`）不参与关联推断，避免使用。
