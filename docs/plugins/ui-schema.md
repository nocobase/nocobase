# ui-schema

将客户端 SchemaComponent 的 Schema 存储在服务端，以实现按需动态输出。

HTTP API

```bash
POST /ui_schemas:prepend/<key>
POST /ui_schemas:append/<key>
POST /ui_schemas:insertBefore/<key>
POST /ui_schemas:insertAfter/<key>
POST /ui_schemas:remove/<key>
POST /ui_schemas:updateJsonSchema
POST /ui_schemas:getJsonSchema/<key>
POST /ui_schemas:getProperties/<key>
```

SDK API

```ts
// 插入 与 移动
// 如果提供的 schema 不存在则新增并插入，如果 schemaKey 存在，将 schemaKey 节点移动过来

// 插入到 key 的所有相邻子节点最前面
uiSchemas.prepend(key, schema | schemaKey)
// 插入到 key 的所有相邻子节点最后面
uiSchemas.append(key, schema | schemaKey)
// 插入到 key 节点前面
uiSchemas.insertBefore(key, schema | schemaKey)
// 插入到 key 节点后面
uiSchemas.insertAfter(key, schema | schemaKey)

//其他操作

// 移除 key 节点，节点以下子节点全部删除
uiSchemas.remove(schema | schemaKey)
// 更新节点，有子节点时，不存在需要新建，并建立节点关系
uiSchemas.updateJsonSchema(schema)
// 查询 schemaKey 节点的 JSON Schema，包括所有子节点，async 的跳过
uiSchemas.getJsonSchema(schemaKey)
// 查询父节点为 parentKey 的所有子节点
uiSchemas.getProperties(parentKey)
```
