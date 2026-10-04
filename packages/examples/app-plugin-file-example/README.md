# File Repository 示例

演示如何通过 `@nocobase/app-plugin-file` 的公共接口接入文件 Repository，并按真实业务方式把文件接入一对一、一对多关系。示例插件拥有业务配置，核心插件只提供通用能力。

| 内容                                                            | 所属插件                  |
| --------------------------------------------------------------- | ------------------------- |
| Client／Server Manager、Token、Provider、上传编排、路由定义工具 | `app-plugin-file`         |
| 文件表与业务表迁移、具体资源 API、下载入口、页面和翻译          | `app-plugin-file-example` |

在应用中先注册核心插件，再注册示例插件：

```ts
// client/plugins.ts
import fileRepository from '@nocobase/app-plugin-file/client';
import fileRepositoryExample from '@nocobase/app-plugin-file-example/client';
defineClientPlugins([fileRepository(), fileRepositoryExample()]);

// server/plugins.ts
import fileRepository from '@nocobase/app-plugin-file/server';
import fileRepositoryExample from '@nocobase/app-plugin-file-example/server';
defineServerPlugins([fileRepository, fileRepositoryExample]);
```

默认应用已完成上述注册。运行 migration 与 seed 后，左侧菜单「文件仓库」下有三个页面：

| 页面                                 | 说明                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `/file-repository`                   | 扁平文件仓库：选择或拖拽文件即上传（单文件 `uploadOne`、批量 `uploadMany`），支持预览和删除元数据。 |
| `/file-repository/profile-avatars`   | 一对一：员工头像。上传后通过 `fileExampleProfiles.avatar` 关联，重复上传自动替换旧头像。            |
| `/file-repository/order-attachments` | 一对多：订单附件。支持批量上传，逐个预览或从订单移除。                                              |

## 业务表与关系

示例迁移创建四个集合：

- `fileExampleProfiles`（员工）：`hasOne('avatar', 'fileExampleProfileAvatars')`，外键 `profileId` 在头像表并带唯一约束，因此一个员工最多一个头像。
- `fileExampleProfileAvatars`（头像文件）：标准文件字段 + 可空 `profileId`。
- `fileExampleOrders`（订单）：`hasMany('attachments', 'fileExampleOrderAttachments')`，外键 `orderId`。
- `fileExampleOrderAttachments`（订单附件文件）：标准文件字段 + 可空 `orderId`。

文件表的业务外键必须可空：上传只写入标准文件字段，业务关联是之后的另一次提交。上传与关联的固定顺序是：

```ts
const { record } = await fileRepositoryManager
  .repository('profileAvatars')
  .uploadOne({ file });
await profiles.updateOne({
  filter: { id: profileId },
  values: { avatar: { connect: { id: record.id } } },
});
```

关系写入由业务 Repository 的 Policy 授权：`fileExampleProfiles` 只允许 `avatar` 的 connect／disconnect，`fileExampleOrders` 只允许 `attachments` 的 connect／disconnect。上传成功后返回的 `record` 已带 `contentUrl`，页面直接用它预览。

演示数据由 `202609110001_seed_file_example_business` 写入：3 名员工、3 个订单，初始都没有文件，方便按需上传。

## 路由

示例 Server 通过 `defineFileRepositoryApiRoutes()` 声明三个文件仓库，使用 `main` 数据库连接、`local` 盘、`stream` 模式。三者共用同一份 Policy：`read: true`、`delete: true`，`create` 是一个空白名单节点而不是 `false` —— 上传本身走的就是 create，节点为 `false` 会连上传一起拒绝，而空白名单只拒绝调用方自带字段的文件记录。

- `POST /api/attachments/<action>`、`POST /api/profileAvatars/<action>`、`POST /api/orderAttachments/<action>`：findMany、findOne、count、exists、deleteOne、uploadOne、uploadMany。
- `GET /uploads/attachments/<uuid>.<ext>`、`GET /uploads/profile-avatars/<uuid>.<ext>`、`GET /uploads/order-attachments/<uuid>.<ext>`：下载完整文件；无扩展名省略后缀。

业务仓库通过 `defineRepositoryApiRoutes()` 声明，只暴露读接口和 `updateOne`，可写字段与关系操作由各自的 Policy 限定：

- `POST /api/fileExampleProfiles/<action>`、`POST /api/fileExampleOrders/<action>`。

以上 `/api` 下的每个动作（含 `uploadOne`、`uploadMany`）都要求已登录用户：示例通过认证插件的 `authentication.required()` 按 `/<name>/<action>` 逐个守卫，因此应用还需要注册 `@nocobase/app-plugin-authentication`。未登录的请求在读取请求体、检查 Policy 之前就得到 401 `AUTHENTICATION_REQUIRED`，不会写入任何存储。内容入口属于根路由，不在 `/api` 下，仍按核心插件的约定公开，持有记录 UUID 即可下载。部署前缀由宿主添加一次，例如 `/main/uploads/profile-avatars/...`。页面直接使用响应中的 `contentUrl`；业务表通过 `findMany()` 读取后与文件表的 `profileId`、`orderId` 在前端分组。React 页面从核心插件导入 `clientFileRepositoryManagerToken`，通过 `useService(clientFileRepositoryManagerToken)` 获取文件仓库管理器；通过 `@nocobase/app-client` 的 `useApiClient()` 获取宿主 HTTP 客户端，再调用 `api.repository()` 访问业务仓库。

这套表和路由仅是示例，不是核心插件的默认约定。业务应用可只启用核心插件，使用自己的 collection、disk、accessPath 和 actions。

## Preview

The attachment page explains local Office preview and accepts DOCX, XLSX and PPTX uploads through the existing File Repository. Select Preview in the file list to render the document in the browser. Order attachments share the same viewer. Viewers load lazily, fetch `contentUrl` with same-origin credentials (omit credentials for cross-origin URLs), and require CORS for external content. No document content is sent to Office Online, and Google Fonts loading is disabled.

The application and file service must remain reachable: this supports an internal network without internet access, not a fully disconnected browser. Deploy the application's JS and WASM assets locally. Use the updated `@nocobase/dev-config` Portal preset or add `@silurus/ooxml` to the existing Vite `optimizeDeps.exclude`. The example declares the viewer as a client peer dependency so installed consumers can build it.

Images, audio and video use `contentUrl`; PDF and text are fetched before display because content routes return attachments. Active HTML/SVG/XML are not rendered inline. Legacy DOC/XLS/PPT and OpenDocument formats remain download-only in this example. Failed local Office previews show an error while the dialog retains its download link. For the full editable Registry UI, including Markdown and legacy Office Online fallback, follow the core file plugin Skill.

Verify real DOCX/XLSX/PPTX files on the attachment and order pages, including switching/closing during loading, malformed files, CORS failures, and a served production build with external network requests blocked. Unit viewer mocks do not verify rendering fidelity.

## 范围与限制

首版保持已确认范围：Server 的 `/api` 路由只要求登录，不按用户区分数据，所有已登录用户共享同一个工作区；内容入口公开；deleteOne 只删元数据；移除关系只清空外键，不删除文件；不支持 Range/206 或条件缓存。示例页面已注册为应用页面，登录后即可使用。

迁移从尚未发布的核心插件原样移动，保留名称与内容。迁移器按名称和内容校验识别既有执行记录，因此本地已执行的同一迁移不会重复建表，也无需修改附件或迁移历史。
