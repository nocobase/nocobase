# 文件 Repository 设计

状态：**首版已实现**。本文件保留在 `docs/proposals` 作为已采纳设计；文末列出的后续能力尚未实现。实际接入方式见[使用手册](../README.md)。示例表与资源统一使用 `attachments`，由独立的 `@nocobase/app-plugin-file-example` 拥有。核心插件仅提供 Manager、Provider、Token 和 `defineFileRepositoryApiRoutes()`；不携带迁移、具体资源配置、页面或 locales。

## 1. 两端 Service

| 运行端 | Service / Token                                                    | 底层能力                                                       |
| ------ | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| Server | `ServerFileRepositoryManager` / `serverFileRepositoryManagerToken` | `db.repository()`、Drive Manager                               |
| Client | `ClientFileRepositoryManager` / `clientFileRepositoryManagerToken` | 应用已有 `apiClientToken`：`api.repository()`、`api.request()` |

Token 分别从插件 `./server`、`./client` 导出，Provider 注册应用级单例。`repository()` 获取操作对象，不上传、建表或修改数据。

```ts
// Server
const manager = container.resolve(serverFileRepositoryManagerToken);
const attachments = manager.repository('attachments', {
  connection: 'main', // 可省略，沿用数据库默认连接。
  disk: 'public',
  accessPath: '/uploads/attachments',
});

// Client；参数是 API 资源名，不是数据库连接或磁盘配置。
const manager = container.resolve(clientFileRepositoryManagerToken);
const attachments = manager.repository('attachments');

// 两端共同方法的参数结构一致。
await attachments.findMany({ limit: 20 });
await attachments.uploadOne({ file });
await attachments.uploadMany({ files });
```

普通 CRUD 委托现有 Repository。单上传返回 `{ record, createdTargets, version? }`，批量返回 `{ createdCount, records }`；Client 自动解开 HTTP `{ data }`。上传已包含入库，不必再次 create。Server 保留数据库 Repository 的其他方法，Client 仅具有现有 RemoteRepository 支持的方法。

## 2. Collection 固定字段

可使用任意 collection 名称，但以下字段必须存在，不提供映射，不自动补表。

| 字段                     | 内容及来源                                                 | 兼容类型                                  |
| ------------------------ | ---------------------------------------------------------- | ----------------------------------------- |
| `id`                     | 服务端生成的 UUID；唯一主键字段                            | uuid，或能容纳 36 字符的 string/char/text |
| `disk`                   | Server Repository 的上传配置                               | string/char/text                          |
| `key`                    | 服务端生成 `objects/<uuid>.<ext>`，与访问路径分离          | string/char/text                          |
| `filename`               | 上传原名，移除路径和控制字符，规范化 Unicode               | string/char/text                          |
| `ext`                    | 小写扩展名，无点号；仅 1–32 位字母数字，其他及无扩展名为空 | string/char/text                          |
| `mimeType`               | 规范化上传声明与存储 metadata；非法值回退为 octet-stream   | string/char/text                          |
| `size`                   | `disk.getMetaData(key).contentLength`，校验与上传大小一致  | integer/bigInt                            |
| `createdAt`、`updatedAt` | 服务端写入 UTC 时间，按字段类型序列化                      | datetime/datetimeTz                       |

Collection 不存在、字段缺失、类型不兼容、主键不兼容时，报 `INVALID_FILE_COLLECTION`，指出 collection 和字段。CRUD、上传和内容查询均校验；上传在写 Disk 前校验。可增加业务字段，但上传不接受额外 values，业务必填字段须有默认值。

`contentUrl` 是响应派生字段，不落库。上传响应、普通 CRUD 和 NDJSON 查询中的记录，只要同时包含 `id`、`ext`，就附加此字段；select 不包含这两个字段时不附加，也不强制扩大查询字段。聚合结果不修饰。

## 3. 一次声明 API 与统一访问路由

```ts
const routes = defineFileRepositoryApiRoutes({
  repositories: [
    {
      name: 'attachments',
      collection: 'attachments',
      connection: 'main',
      disk: 'public',
      accessPath: '/uploads/attachments',
      accessMode: 'redirect',
      actions: {
        findMany: { maxLimit: 100 },
        findOne: {},
        count: {},
        exists: {},
        aggregate: {},
        groupBy: {},
        createOne: { writePolicy: false },
        updateOne: { writePolicy: false },
        deleteOne: {},
        uploadOne: { maxSize: 5 * 1024 * 1024 },
        uploadMany: { maxSize: 20 * 1024 * 1024 },
      },
    },
  ],
});
// 将 routes 展开到 Server routes 贡献列表。
```

`name` 是 Client 资源别名，`collection` 默认同 name，`connection` 可省略。普通 action 直接复用 `defineRepositoryApiRoutes` 的 JSON 协议、查询能力、写策略和错误处理。`createOne`、`updateOne` 默认禁止写入，业务可显式配置 writePolicy；它不等于用户权限。

| 方法 | 路径                                | 行为                                |
| ---- | ----------------------------------- | ----------------------------------- |
| POST | `/api/attachments/findMany`         | 查询多条，支持现有 NDJSON 流式协议  |
| POST | `/api/attachments/findOne`          | 查询单条                            |
| POST | `/api/attachments/count`            | 计数                                |
| POST | `/api/attachments/exists`           | 存在性                              |
| POST | `/api/attachments/aggregate`        | 聚合                                |
| POST | `/api/attachments/groupBy`          | 分组聚合                            |
| POST | `/api/attachments/createOne`        | 创建元数据，不上传内容              |
| POST | `/api/attachments/updateOne`        | 修改元数据，不替换内容              |
| POST | `/api/attachments/deleteOne`        | 删除元数据，不删除物理文件          |
| POST | `/api/attachments/uploadOne`        | 单文件上传并 createOne              |
| POST | `/api/attachments/uploadMany`       | 多文件上传并一次 createMany         |
| GET  | `/uploads/attachments/<uuid>.<ext>` | 内容访问，不要求开放 findOne action |

只注册声明的 action。当前通用 HTTP 适配器不开放 createMany/updateMany/deleteMany；uploadMany 在服务端直接调用 createMany。没有额外 REST 风格路由。

示例插件注册使用 `attachments` 表、`local` 盘、`stream`，开放 findMany/findOne/count/exists/deleteOne/uploadOne/uploadMany。上面的完整配置是自定义资源示例；启用示例插件时，不要重复注册 attachments。核心插件可以独立注册，不会自动生成这些路由。

## 4. 上传边界与失败处理

参考 [Hono 上传示例](https://hono.dev/examples/file-upload) 和 [FlyDrive Disk API](https://flydrive.dev/docs/disk_api)。两个 action 接收 multipart/form-data，字段统一叫 `file`：单上传只能出现一次，批量重复同名字段。Client 使用 `api.request({ path, method: 'POST', body: FormData })`，由浏览器生成 boundary。

Hono `bodyLimit` 在 `parseBody({ all: true })` 前执行。`uploadOne.maxSize` 默认 5 MiB，`uploadMany.maxSize` 默认 20 MiB，统计完整请求体，包含表单开销。超限返回 413 `BODY_TOO_LARGE`，非 multipart 请求返回 415 `UNSUPPORTED_MEDIA_TYPE`，空文件列表或非 File 返回 400 `INVALID_FILE` / `INVALID_FILES`，都使用统一的 `/api` 错误体，`domain` 为 `file`，客户端按 `reason` 判断；零字节文件可上传。上传成功返回 201。无额外数量上限。

流程为：校验字段 → 生成 UUID/key → putStream → getMetaData → createOne/createMany。批量顺序写对象，最后一次 createMany，显式选择返回核心字段。核心存储元数据不接受客户端覆盖。

上传、metadata 或入库失败时，等待操作完成并补偿删除本次对象。数据库操作报错后先检查是否已提交：已有关联记录的对象保留；无法核实提交状态时保留对象并报 `FILE_COMMIT_UNCERTAIN`；补偿删除失败报 `FILE_CLEANUP_FAILED`，原因链保留原始异常。成功入库后的响应处理错误不会触发删除。没有跨数据库与对象存储的原子事务，也没有幂等重试协议。

## 5. 统一地址与两种访问方式

| 配置         | 默认值            | 说明                                                                                 |
| ------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `accessPath` | `/uploads/<name>` | 应用根路径，不在 `/api` 下；使用字母数字、下划线、连字符组成的静态路径段，不含尾斜杠 |
| `accessMode` | `stream`          | 仅 `stream` 或 `redirect`，不提供自动回退                                            |

同次声明会检查相同或相互嵌套的 accessPath 冲突；不同贡献之间的路径分配由应用负责。

```ts
const attachments = manager.repository(entry.collection, {
  connection: entry.connection,
  disk: entry.disk,
  accessPath,
});

attachments.getUrl(record); // 同步：<accessPath>/<uuid>.<ext>
await attachments.getStorageUrl(record); // 异步：实际公开 URL 或签名 URL
```

两种方法不重复查询记录。getUrl 不访问存储；无扩展名省略点号。直接使用 Manager 时传入与路由一致的 accessPath。HTTP 响应修饰统一添加宿主 publicBasePath 一次，例如 `/main/uploads/attachments/...`，Client 直接使用 contentUrl。

内容入口按 UUID 查询记录、检查扩展名，并使用**记录的 disk/key**读取对象，不使用当前默认盘推导旧文件位置。

- `stream`：通过 getStream 返回完整文件，设置 Content-Type、Content-Length、下载文件名、nosniff 和 sandbox 响应头。
- `redirect`：公开对象调用 getUrl；私有对象调用 getSignedUrl，默认有效期 5 分钟；返回 302。不能生成 URL 时明确报 `STORAGE_URL_UNAVAILABLE`，不回退到统一地址或 stream；检查指向本组内容入口的循环跳转。

两种访问响应均使用 `Cache-Control: private, no-store`。记录或实际对象不存在返回 404。

## 6. 首版暂不实现

- 路由认证、资源授权、行级权限、访问凭证接入。首版没有这些访问保护。
- Range/206、断点下载、视频拖动所需分段读取、ETag 和条件请求。
- 物理文件删除策略、孤儿扫描与自动对账、断点上传及幂等重试。
- 内容嗅探、恶意文件检测、业务 MIME 白名单，以及旧 `app-plugin-file` 消费者迁移。
