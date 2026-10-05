# 文件 Repository 使用手册

`@nocobase/app-plugin-file` 提供文件上传、元数据 CRUD 和统一访问地址。Server 的 `ServerFileRepositoryManager` 基于数据库 Repository 与 Drive；Client 的 `ClientFileRepositoryManager` 复用应用已有的 `api.repository()` 和 `api.request()`。

本文依次介绍服务端路由、服务端 Service、客户端常规调用、React Hook 调用。示例统一使用 `attachments`。

## 使用前准备

在目标 App 的 `server/plugins.ts` 注册插件 `./server` 的默认导出，在 `client/plugins.ts` 注册 `./client` 默认导出工厂的调用结果。保留原有插件列表，将核心插件放在使用它的业务插件之前。

核心插件只提供 Service 和路由工具。应用或业务插件负责创建 collection、配置 Drive disk、声明具体资源路由和页面。本文假定已有 `main` 数据库连接和 `local` disk。

需要可运行示例时，使用独立的 [File Repository Example](../../../examples/app-plugin-file-example/README.md)。它包含 `attachments` 迁移、资源路由和 `/file-repository` 页面；启用后不要再重复创建该表或注册同名资源。

### Collection 固定字段

Collection 名可自定义，以下字段必须存在，不支持映射，也不会自动建表。可参考示例插件的[迁移](../../../examples/app-plugin-file-example/database/migrations/202609070001_create_attachments.ts)，在自己的迁移中明确声明字段。

| 字段                     | 上传时的内容及来源                                                     | 兼容类型                                  |
| ------------------------ | ---------------------------------------------------------------------- | ----------------------------------------- |
| `id`                     | 服务端生成 UUID，必须是唯一主键字段                                    | uuid，或能容纳 36 字符的 string/char/text |
| `disk`                   | Server Repository 配置的上传磁盘                                       | string/char/text                          |
| `key`                    | 服务端生成 `objects/<uuid>.<ext>`，无扩展名省略点号                    | string/char/text                          |
| `filename`               | 上传原名，移除路径和控制字符、规范化 Unicode                           | string/char/text                          |
| `ext`                    | 小写扩展名，不含点号；仅 1–32 位字母数字，其他情况为空字符串           | string/char/text                          |
| `mimeType`               | 规范化上传声明和存储 metadata，非法值回退为 `application/octet-stream` | string/char/text                          |
| `size`                   | `disk.getMetaData(key).contentLength`，校验与上传大小一致              | integer/bigInt                            |
| `createdAt`、`updatedAt` | 服务端写入 UTC 时间                                                    | datetime/datetimeTz                       |

缺表、缺字段或类型、主键不兼容时，操作报 `INVALID_FILE_COLLECTION` 并指出字段；上传在写 Disk 前校验。可增加业务字段，但上传接口不接收额外 `values`，因此业务必填字段需要默认值。

`contentUrl` 是响应派生字段，不需要建列。

## 1. 服务端定义路由

在应用或业务插件的 `server/routes/index.ts` 中声明：

```ts
import { defineFileRepositoryApiRoutes } from '@nocobase/app-plugin-file/server';

const routes = defineFileRepositoryApiRoutes({
  repositories: [
    {
      name: 'attachments',
      collection: 'attachments',
      connection: 'main',
      disk: 'local',
      accessPath: '/uploads/attachments',
      accessMode: 'stream',
      policy: {
        read: true,
        // 空白名单而不是 false：上传走的就是 create，`false` 会连上传一起拒绝。
        create: { scope: true },
        update: false,
        delete: true,
      },
      actions: {
        findMany: { maxLimit: 100 },
        findOne: {},
        count: {},
        exists: {},
        aggregate: {},
        groupBy: {},
        createOne: {},
        updateOne: {},
        deleteOne: {},
        uploadOne: { maxSize: 5 * 1024 * 1024 },
        uploadMany: { maxSize: 20 * 1024 * 1024 },
      },
    },
  ],
});

export default routes;
```

这是全部 action 的配置示例，实际使用只保留需要的操作。`actions` 只决定开哪些端点，能做什么由必填的 `policy` 决定，它同样管上传。

上传不接受调用方的任何字段（`store()` 自己合成全部值），所以上传路径绑定的是从这份 Policy 派生出来的一份：继承 `create.scope` 和 `create.defaults`，字段白名单换成文件表自己的九列。由此有三条：`create: false` 会连上传一起拒绝，而且在检查请求体大小、内容类型、读取 multipart 之前就以 `403 WRITE_FORBIDDEN`（domain `app`）拒绝，不会向存储写入任何内容；`create.defaults` 里的 `{ ownerId }` 会写进上传出来的记录；`create.scope` 同样对上传生效，越界的写入回滚并清理已上传对象。要允许上传但不允许调用方自己造文件记录，就写一个不含 `fields` 的 `create` 节点，像上例那样。

`accessPath` 下的内容路由是有意的例外：它在 `/api` 之外、没有认证，Policy 不覆盖它。普通 action 复用 `defineRepositoryApiRoutes()` 的协议。

将返回的路由贡献数组接入已有的 Server 声明。业务插件可这样组合，已有其他贡献时合并到原来的列表：

```ts
import path from 'node:path';
import { defineServerPlugin } from '@nocobase/app-server/plugins';
import routes from './routes/index.js';

export default defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-business-attachments',
  routes,
});
```

这里的 `packageName` 应使用业务插件自己的包名。若直接在 App 内定义，则合并到 App 的 Server `routes` 列表。

| 配置         | 默认值            | 说明                                 |
| ------------ | ----------------- | ------------------------------------ |
| `name`       | 必填              | Client 使用的 API 资源名             |
| `collection` | 同 `name`         | 数据库 collection 名，可与资源名不同 |
| `connection` | 数据库默认连接    | 仅在 Server 配置                     |
| `disk`       | 必填              | 已配置的上传磁盘                     |
| `accessPath` | `/uploads/<name>` | 应用根路径，不在 `/api` 下           |
| `accessMode` | `stream`          | `stream` 或 `redirect`，不自动回退   |
| `actions`    | 必填              | 只开放明确列出的 action              |

`accessPath` 以 `/` 开头、不带尾斜杠，每段由字母数字、下划线、连字符组成。同一次声明会拒绝重复或相互嵌套的访问路径；不同路由贡献之间由应用分配路径。

### 生成的路由

以上完整声明生成以下路由。未声明的 action 不生成对应 POST 路由；内容 GET 路由独立存在，不要求开放 `findOne`。

| 方法 | 路径                                | 行为                                               |
| ---- | ----------------------------------- | -------------------------------------------------- |
| POST | `/api/attachments/findMany`         | 查询多条，支持现有 NDJSON 流式协议                 |
| POST | `/api/attachments/findOne`          | 查询单条                                           |
| POST | `/api/attachments/count`            | 计数                                               |
| POST | `/api/attachments/exists`           | 判断存在                                           |
| POST | `/api/attachments/aggregate`        | 聚合                                               |
| POST | `/api/attachments/groupBy`          | 分组聚合                                           |
| POST | `/api/attachments/createOne`        | 创建元数据，不上传文件；受 Policy 的 `create` 限制 |
| POST | `/api/attachments/updateOne`        | 修改元数据，不替换文件；受 Policy 的 `update` 限制 |
| POST | `/api/attachments/deleteOne`        | 删除元数据，不删除物理文件                         |
| POST | `/api/attachments/uploadOne`        | 上传单个文件并创建记录                             |
| POST | `/api/attachments/uploadMany`       | 上传多个文件并批量创建记录                         |
| GET  | `/uploads/attachments/<uuid>.<ext>` | 获取文件内容，无扩展名省略点号                     |

没有额外的 REST 路由，也没有 `createMany`、`updateMany`、`deleteMany` HTTP action。`uploadMany` 在服务端内部调用 `createMany`。

所有 `/api` 下的路由都会出现在运行中应用的 API 文档里：登录后打开 `/api/swagger/docs`，或读取 JSON `/api/swagger`。它们以暴露名作为标签（如 `Attachments`），operationId 形如 `attachmentsFindMany`、`attachmentsUploadOne`；上传操作按 `multipart/form-data` 描述，并列出 `maxSize`、`201` 结果和 `400`/`403`/`413`/`415` 错误。内容 GET 路由不在 `/api` 下，不出现在文档里。

### 统一地址与访问方式

内容入口通过 UUID 查询记录、核对扩展名，再使用记录的 `disk` 和 `key` 获取文件。更换上传默认盘不会改变旧文件的存储位置。

- `stream`：服务端返回完整文件流，带类型、大小和下载文件名，使用 `Content-Disposition: attachment`。适合本地盘或不能生成存储 URL 的盘。
- `redirect`：302 跳转到存储 URL。公开文件使用 Disk 的 `getUrl()`，私有文件使用有效期 5 分钟的签名 URL；磁盘不支持时报告 `STORAGE_URL_UNAVAILABLE`。

两种响应均使用 `Cache-Control: private, no-store`；记录或对象不存在返回 404。宿主挂载在 `/main` 时，实际入口是 `/main/api/attachments/uploadOne` 和 `/main/uploads/attachments/...`，HTTP 返回的 `contentUrl` 已包含该前缀。

## 2. 服务端使用 Service

从当前应用的容器解析 Manager，不需要再创建 Factory。以下函数可由已就绪的 Server Service 或路由调用，传入应用的 `app.container`；ServiceProvider 内可从 `this.app.container` 获取。

```ts
import type { ServiceContainer } from '@nocobase/service-provider';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';

export async function uploadAttachment(
  container: ServiceContainer,
  file: File,
) {
  const manager = container.resolve(serverFileRepositoryManagerToken);
  const attachments = manager.repository('attachments', {
    connection: 'main',
    disk: 'local',
    accessPath: '/uploads/attachments',
  });

  const { record } = await attachments.uploadOne({ file });
  const records = await attachments.findMany({ limit: 20 });
  const url = attachments.getUrl(record);
  return { record, records, url };
}
```

直接使用 Manager 时，`disk`、`accessPath` 必填，`connection` 可省略。第一个参数是 collection 名；配置应与该 collection 的访问路由一致。`repository()` 只获取操作对象，不建表、不注册路由。

`attachments.getUrl(record)` 同步生成应用内路径，如 `/uploads/attachments/<uuid>.jpg`，不查询数据库或存储。`await attachments.getStorageUrl(record)` 返回实际公开 URL 或私有签名 URL，使用记录的 disk/key，要求磁盘支持生成对应 URL。

Server 保留数据库 Repository 的普通方法；共同方法的参数结构与 Client 一致。Server 上传结果带应用内 `contentUrl`，直接调用普通 CRUD 不自动附加它，需要时调用 `getUrl(record)`。

## 3. 客户端常规调用

复用当前 Client 应用容器中已注册的 Manager。普通 TypeScript 模块可接收 `app.container`；Client ServiceProvider 内使用 `this.app.container`。不要另建 API Client，否则会丢失应用已有的请求配置。

```ts
import type { ServiceContainer } from '@nocobase/service-provider';
import { clientFileRepositoryManagerToken } from '@nocobase/app-plugin-file/client';

export async function uploadAttachments(
  container: ServiceContainer,
  files: readonly File[],
) {
  const manager = container.resolve(clientFileRepositoryManagerToken);
  const attachments = manager.repository('attachments');
  const result = await attachments.uploadMany({ files });
  return result.records;
}
```

Client 的 `repository('attachments')` 接收 Server 声明的 `name`，不传 connection、disk 或 accessPath。获取 `attachments` 后，两端都可这样调用：

```ts
const records = await attachments.findMany({ limit: 20 });
const { record } = await attachments.uploadOne({ file });
const batch = await attachments.uploadMany({ files });
await attachments.deleteOne({ filter: { id: record.id } });
```

`file` 是原生 `File`，`files` 是非空 File 数组。单上传返回 `{ record, createdTargets, version? }`，批量返回 `{ createdCount, records }`。上传已写入数据库，无需再次调用 create。Client 自动解包 HTTP 的 `{ data }`。

Client 直接用 `record.contentUrl` 下载，不拼接 `/api`，也不调用 Server 的 `getUrl()`、`getStorageUrl()`。HTTP 查询返回的记录须同时包含 `id`、`ext` 才会附加 `contentUrl`；自定义 select 时保留它们：

```ts
const records = await attachments.findMany({
  select: (s) => s.fields('id', 'ext', 'filename'),
  limit: 20,
});
```

普通 CRUD 的参数沿用 [Repository API](../../../libs/db/docs/zh-CN/reference/repository-api.md) 和 [API Client](../../../libs/api-client/README.md)。Server 保留本地 Repository 的完整能力，Client 方法以 RemoteRepository 为准。

## 4. React 中使用 Hook

使用应用已有的 `useService()`，无需文件专用 Hook。组件必须位于已启动的 App React 上下文内，在事件处理器中执行上传：

```tsx
import { useMemo, useState } from 'react';
import { useService } from '@nocobase/app-client';
import { clientFileRepositoryManagerToken } from '@nocobase/app-plugin-file/client';

export function AttachmentUpload() {
  const manager = useService(clientFileRepositoryManagerToken);
  const attachments = useMemo(
    () => manager.repository('attachments'),
    [manager],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState<string>();

  async function upload(file: File) {
    setBusy(true);
    setError('');
    setUrl(undefined);
    try {
      const { record } = await attachments.uploadOne({ file });
      setUrl(record.contentUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : '上传失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        aria-label='选择附件'
        type='file'
        disabled={busy}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) void upload(file);
        }}
      />
      {busy && <p role='status'>上传中…</p>}
      {error && <p role='alert'>{error}</p>}
      {url && <a href={url}>下载附件</a>}
    </div>
  );
}
```

批量上传时为 input 添加 `multiple`，将 `FileList` 转为 `Array.from(...)`，调用 `uploadMany({ files })`。实际业务页面沿用应用的样式和 i18n 约定；本例只展示调用流程。

## 上传限制与错误处理

两个上传 action 接收 `multipart/form-data`，字段名均为 `file`；批量重复该字段。Client Manager 自动创建 FormData，不要手工设置 Content-Type boundary。实现参考 [Hono 文件上传](https://hono.dev/examples/file-upload) 和 [FlyDrive Disk API](https://flydrive.dev/docs/disk_api)。

`actions.uploadOne.maxSize` 默认 5 MiB，`actions.uploadMany.maxSize` 默认 20 MiB，限制的是**整个 HTTP 请求体**，包含 multipart 开销；批量不是每文件单独限额。限制在解析前执行，不适用于直接调用 Server Service。零字节文件允许上传，批量必须至少一个文件，目前无额外数量上限。

上传接口的错误使用应用统一的 `/api` 错误体 `{ error: { code, status, reason, domain, message, requestId } }`，客户端按 `reason` 分支，不要解析 `message`。下表的原因都属于 `file` 域；普通 action 的错误沿用 `defineRepositoryApiRoutes` 的 `app` 域。上传成功返回 201 和创建结果。

| 原因                                            | HTTP 状态 | `status`            | 处理方向                                          |
| ----------------------------------------------- | --------- | ------------------- | ------------------------------------------------- |
| `BODY_TOO_LARGE`                                | 413       | `INVALID_ARGUMENT`  | 减小本次上传总量，或调整 upload action 的 maxSize |
| `UNSUPPORTED_MEDIA_TYPE`                        | 415       | `INVALID_ARGUMENT`  | 使用 `multipart/form-data` 请求                   |
| `INVALID_MULTIPART`                             | 400       | `INVALID_ARGUMENT`  | 检查 multipart 格式                               |
| `INVALID_FILE` / `INVALID_FILES`                | 400       | `INVALID_ARGUMENT`  | 单传必须恰好一个 File，批量必须非空且全是 File    |
| `PRINCIPAL_REQUIRED`                            | 403       | `PERMISSION_DENIED` | Policy 函数需要 principal，检查认证与解析器       |
| `STORAGE_URL_UNAVAILABLE`                       | 503       | `UNAVAILABLE`       | 检查 Disk URL 能力，或选择 stream                 |
| `INVALID_FILE_COLLECTION`                       | 500       | `INTERNAL`          | 修正 collection 固定字段或迁移                    |
| `INVALID_FILE_METADATA`                         | 500       | `INTERNAL`          | 检查存储 metadata 和实际文件大小                  |
| `FILE_COMMIT_UNCERTAIN` / `FILE_CLEANUP_FAILED` | 500       | `INTERNAL`          | 核对数据库记录和本次存储对象后再决定重试或清理    |

`INVALID_FILE_COLLECTION` 和 `INVALID_FILE_METADATA` 是服务端配置或存储数据的问题，请求方无法通过修改请求解决，所以是 500。`FILE_COMMIT_UNCERTAIN` 不归为 503，因为记录可能已经写入，直接重试可能存出两份文件。

上传失败会尝试清理本次写入的对象；数据库提交状态无法确认时保留对象并报错，补偿删除失败也会明确报错。没有跨数据库和对象存储的原子事务，不应无条件自动重试。

## 当前限制

- 未接入路由认证和访问凭证。Policy 限制的是这个 principal 能读写什么，不代表请求已经通过认证；`accessPath` 下的内容路由完全公开。
- stream 仅支持完整文件下载；未实现 Range/206、断点下载、ETag 和条件请求。
- `deleteOne` 只删元数据；未实现物理文件删除策略、孤儿扫描、自动对账、断点上传和幂等重试。
- MIME 使用上传声明与存储 metadata；未实现内容嗅探、恶意文件检测、业务类型白名单及旧 `app-plugin-file` 消费者迁移。
