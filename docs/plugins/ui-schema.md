# ui-schema

将客户端 SchemaComponent 的 Schema 存储在服务端，以实现按需动态输出。

## HTTP API

常规的 REST API

```bash
GET     /api/ui_schemas
POST    /api/ui_schemas
GET     /api/ui_schemas/<schemaKey>
PUT     /api/ui_schemas/<schemaKey>
DELETE  /api/ui_schemas/<schemaKey>
```

自定义

```bash
# 输出所有 parentKey 为 <schemaKey> 下的 JSON Schema（递归处理）
GET /api/ui_schemas:getJsonSchema?filter[parentKey]=<schemaKey>
# 输出 key 为 <schemaKey> 的 JSON Schema
GET /api/ui_schemas:getJsonSchema/<schemaKey>
```
