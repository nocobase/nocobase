---
pkg: '@nocobase/plugin-file-manager'
title: "稳定 URL（代理 URL）"
description: "介绍 NocoBase 文件稳定 URL 的格式、访问权限，以及它在附件字段、文件表、Markdown、文件预览和 HTTP API 中的表现。"
keywords: "稳定 URL,代理 URL,永久 URL,文件访问,文件权限,Office 预览,NocoBase"
---

# 稳定 URL

在 NocoBase 中，由存储引擎托管的文件会通过**稳定 URL（Stable URL）**访问。这个地址先进入 NocoBase，再由 NocoBase 检查文件记录和访问权限，最后重定向到存储引擎生成的实际地址。

## URL 格式

文件记录返回的地址通常是：

```text
/files/<app>/<dataSource>/<collection>/<id><extname>
```

比如：

```text
/files/main/main/attachments/42.pdf
```

如果 NocoBase 配置了 `APP_PUBLIC_PATH=/nocobase`，地址会自动带上该前缀：

```text
/nocobase/files/main/main/attachments/42.pdf
```

其中：

- `app` 是应用名称
- `dataSource` 是数据源标识
- `collection` 是附件表或文件表名称
- `id` 是文件记录的 ID
- `extname` 是文件扩展名，没有扩展名时不会追加

文件创建后，`id` 和 `extname` 不允许修改，因此同一条文件记录的地址可以保持稳定。

## 不同用途的地址

同一条文件记录会根据用途使用不同的 query 参数：

| 用途 | 地址形式 | 表现 |
|---|---|---|
| 打开或内嵌文件 | `/files/.../42.pdf` | 检查权限后重定向到文件实际地址 |
| 预览图片等内容 | `/files/.../42.png?preview=1` | 检查权限后重定向到存储引擎的预览地址；存储引擎支持缩略图规则时会使用缩略图 |
| 下载文件 | `/files/.../42.pdf?download=1` | 检查权限后返回带下载语义的实际地址 |
| Office 在线预览 | `/files/.../42.xlsx?temporaryAccessToken=...` | 供 Microsoft Office Online Viewer 短期读取，不作为普通文件地址保存 |

:::tip

业务代码通常只需要使用接口返回的 `url` 和 `preview`，不需要自己拼接 `/files` 地址或 query 参数。

:::

## 在各个地方的表现

### 附件字段和文件表

附件字段与文件表中的系统托管文件，上传、查询和关联读取后返回的 `url` 都是稳定 URL，`preview` 则是在同一地址上增加 `preview=1`。

图片、PDF、音视频和文本等文件仍可在 NocoBase 中预览。刚上传的本地图片会优先使用浏览器生成的临时本地预览，数据重新读取后再使用稳定 URL，避免上传完成时出现重复请求或缩略图闪烁。

### HTTP API

通过 [HTTP API](./http-api.md) 上传或查询文件时，响应中的 `url` / `preview` 不再暴露本地路径、对象存储域名或预签名下载地址。调用方访问稳定 URL 时需要携带对应应用的登录凭证。

稳定 URL 返回 `302` 重定向，不直接代理文件流。如果使用 `curl` 等客户端读取文件内容，需要允许跟随重定向：

```bash
curl -L \
  -H "Authorization: Bearer <JWT>" \
  "https://example.com/files/main/main/attachments/42.pdf"
```

浏览器直接打开文件时通常使用登录 cookie。`GET` 和 `HEAD` 可以访问稳定 URL，其他 HTTP 方法会返回 `405`。

### Markdown 编辑器

在 Markdown 编辑器中上传文件后，写入 Markdown 内容的是稳定 URL。私有 S3、OSS、COS 或 S3 Pro 存储也可以使用这种方式，不需要把存储空间调整为公开读取。

如果 Markdown 内容会展示在未登录页面，那么查看者仍需要拥有文件查看权限。仅把稳定 URL 写入 Markdown，不会自动把文件公开。

### 附件 URL 字段

附件 URL 字段上传到 NocoBase 存储引擎后，字段中保存的是稳定 URL。图片缩略图会使用对应的 `preview` 地址。

如果字段保存的是手工输入的外部 URL，并且文件记录没有 `storageId`，NocoBase 会继续保留并返回原始外部 URL。这类文件不经过稳定 URL 的权限检查和重定向流程。

### 普通文件预览

图片、PDF、音频、视频和文本预览会直接使用稳定 URL。浏览器请求会携带 NocoBase 登录 cookie，再按当前角色检查附件表或文件表的 `get/view` 权限。

对于对象存储中的 PDF 等文件，最终预览方式还会受到存储服务 CORS 配置的影响。如果自定义前端通过 `fetch()` 读取重定向后的对象存储地址，也需要确保对象存储允许当前站点跨域访问。

### Office 文件预览

Microsoft Office Online Viewer 由 Microsoft 服务端拉取文件，无法携带用户浏览器中的 NocoBase cookie。因此，用户真正打开 Office 预览时，NocoBase 会先检查该文件的查看权限，再签发一个短期临时 URL。

临时 URL 默认有效 10 分钟，可以通过 `TEMPORARY_FILE_ACCESS_EXPIRES_IN` 配置为 5 到 10 分钟。它只绑定当前文件，过期后无法继续使用。重新打开预览时会重新申请，加载失败时预览器也可能重新申请一次。

:::warning 注意

临时 URL 只用于外部预览服务读取文件。不要把它写回附件字段、Markdown 或业务表，也不要把它当成长期分享链接。

:::

### 公开表单

访客在公开表单中上传文件后，NocoBase 会在当前公开表单会话中记录这些文件。上传者可以继续看到自己刚上传的图片或附件。

这个访问范围只服务于当前公开表单会话，并不是通用的公开文件链接。把地址复制到其他浏览器或当前会话失效后，仍可能无法访问。

## 权限和重定向

访问稳定 URL 时，NocoBase 会按照 URL 中的应用、数据源、文件表和记录 ID 定位文件。其中：

1. 已登录用户使用当前应用的登录 cookie 或认证信息，并检查当前角色的文件查看权限。
2. 公开表单等插件可以对特定文件提供额外的受限授权。
3. 检查通过后，NocoBase 返回 `302`，跳转到本地存储或对象存储生成的实际地址。

因此，稳定 URL 隔离了业务数据和存储实现。切换存储域名、更新对象存储签名或调整缩略图规则时，业务字段中保存的地址通常不需要跟着修改。

## 使用注意

- 稳定不等于公开。复制链接给其他人后，对方仍需要登录并拥有文件查看权限
- 稳定不等于永不失效。删除文件记录、删除文件、变更应用或数据源标识、移动到另一张文件表后，原地址会失效
- 不要持久化 `temporaryAccessToken`。它是短期凭证，也可能进入浏览器历史和访问日志
- 不要缓存 `302 Location` 作为永久地址。对象存储签名可能过期，应该每次从稳定 URL 重新解析
- 不要自行替换 URL 中的 `app`、`dataSource`、`collection`、`id` 或扩展名。路径与文件记录不一致时会被拒绝
- 反向代理需要把 `APP_PUBLIC_PATH` 下的 `/files/` 路径转发到 NocoBase。使用子路径部署时，还应保留根路径 `/files/` 的兼容转发规则。使用 NocoBase CLI 生成的代理配置时会自动包含这些规则
- 部署多个彼此独立的 NocoBase 服务时，应为每个服务使用不同的 `hostname`，不要只通过端口区分。浏览器 cookie 不按端口隔离，详细说明见[生产环境部署](../get-started/deployment/production.md)
- 同一个 NocoBase 部署环境内的子应用会按应用名区分 cookie，不需要单独配置 `hostname`；不过另一个端口上的独立服务如果包含同名主应用或子应用，仍需要通过不同的 `hostname` 隔离
- 如果通过 `<img>`、`<iframe>`、`fetch()` 或第三方客户端访问文件，需要确认它会携带凭证，并能跟随 `302` 重定向
- 真正需要长期对外分享文件时，应使用专门的分享或公开访问方案，不要把稳定 URL 或 Office 临时 URL 当成分享链接

## 相关链接

- [HTTP API](./http-api.md) — 通过 API 上传文件并读取返回的稳定 URL
- [文件预览](./file-preview/index.md) — 查看不同文件类型的预览方式
- [Office 文件预览](./file-preview/ms-office.md) — 配置 Microsoft Office Online Viewer
- [存储引擎](./storage/index.md) — 配置本地存储和对象存储
