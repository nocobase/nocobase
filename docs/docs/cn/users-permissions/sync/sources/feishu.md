---
pkg: '@nocobase/plugin-feishu'
title: "从飞书同步用户数据"
description: "将飞书用户和部门同步到 NocoBase,并通过 HTTP 回调或 Stream 模式接收增量变更。"
keywords: "飞书,Lark,用户同步,部门同步,Stream 模式,事件回调,通讯录,NocoBase"
---

# 从飞书同步用户数据

<PluginInfo commercial="true" name="feishu"></PluginInfo>

## 介绍

**飞书 / Lark** 插件支持将飞书组织中的用户和部门同步到 NocoBase。除了手动执行全量同步,还可以通过 HTTP 回调或 Stream 长连接接收增量变更。

## 准备工作

1. 安装并启用 **飞书 / Lark** 和 **用户数据同步** 插件。
2. 在飞书开放平台创建企业自建应用,参考[认证:飞书 / Lark](/auth-verification/auth-feishu/)。
3. 按下文说明开通通讯录权限并配置通讯录授权范围。

## 配置通讯录权限和授权范围

在飞书开放平台进入应用的 **权限管理**,开通以下权限:

| 权限 | 权限标识 | 是否必需 | 用途 |
| --- | --- | --- | --- |
| 获取用户基本信息 | `contact:user.base:readonly` | 是 | 读取用户姓名、open_id / union_id 等基础字段。 |
| 获取部门基础信息 | `contact:department.base:readonly` | 是 | 读取部门名称和上下级关系。 |
| 获取部门组织架构信息 | `contact:department.organize:readonly` | 是 | 遍历子部门列表,读取部门负责人。 |
| 获取用户组织架构信息 | `contact:user.department:readonly` | 是 | 读取用户所属部门和主部门。 |
| 获取用户 userID | `contact:user.id:readonly` | 唯一标识选 `user_id` 时必需 | 读取 `user_id` 字段。 |
| 获取用户手机号 | `contact:user.phone:readonly` | 同步手机号时必需 | 读取手机号;唯一标识选 `mobile` 时必需。 |
| 获取用户邮箱信息 | `contact:user.email:readonly` | 同步邮箱时必需 | 读取邮箱;唯一标识选 `email` 时必需。 |

:::warning
缺少 **获取用户基本信息** 权限时,接口不返回用户姓名,同步后的昵称为空。接口权限决定应用可以读取哪些字段,**通讯录授权范围** 决定应用可以读取哪些部门和用户,两项都需要配置。同步范围跟随授权范围:只授权部分部门时,NocoBase 只同步该范围内的数据。修改权限或授权范围后,需要重新执行一次全量同步。事件订阅不能代替通讯录读取权限:收到事件后 NocoBase 仍会调用飞书接口读取对应用户或部门的最新信息。
:::

## 添加飞书同步来源

进入 **用户和权限** → **同步**,添加来源,类型选择 **飞书 / Lark**。

配置以下字段:

| 字段 | 说明 |
| --- | --- |
| 来源名称 | 当前同步来源的唯一名称。 |
| 启用 | 启动当前来源的事件接收,并允许执行同步任务。 |
| 区域 | `飞书中国` 或 `Lark Global`。 |
| App ID / App Secret | 飞书应用凭据,支持使用环境变量和密钥。 |
| 用户唯一标识字段 | 可选 `user_id`、`union_id`、`open_id`、`mobile`、`email`,推荐 `union_id`。应与认证器保持一致;缺少所选字段的用户会被跳过。 |
| 事件接收方式 | **HTTP 回调** 或 **Stream 模式**,见下文。 |

保存并启用来源后,点击 **同步** 完成首次全量同步。

## 选择事件接收方式

### Stream 模式

Stream 模式由 NocoBase 服务端主动与飞书建立 WebSocket 长连接,不需要公网回调地址,也不需要配置 Token 或 Encrypt Key。

1. 在 NocoBase 中选择 **Stream 模式**,保存并启用来源。
2. 在飞书开放平台 **事件与回调** 中将事件接收方式切换为 **使用长连接接收事件**,并订阅通讯录变更事件。

来源启用后自动启动长连接(断线自动重连)。更新、停用或删除来源时,对应连接会刷新或关闭。

:::info
Stream 模式不要求公网入站地址,也不需要配置反向代理,适合内网部署。可在应用日志中搜索 `Feishu stream client` 查看连接状态。
:::

### HTTP 回调

HTTP 回调模式通过 NocoBase 的回调地址接收飞书事件。

1. 在 NocoBase 中选择 **HTTP 回调**,配置 **Verification Token** 和(可选)**Encrypt Key**,二者至少配置一项。
2. 保存来源并复制界面显示的 **事件回调 URL**。
3. 在飞书开放平台 **事件与回调** → **事件配置** 中,将接收方式设为将事件推送至开发者服务器,填入回调 URL,并订阅通讯录变更事件。

回调地址必须能够被飞书访问(生产环境使用 HTTPS)。配置 Encrypt Key 后回调内容加密传输,安全性更高。

:::warning
未配置 Verification Token 或 Encrypt Key 时,回调请求会被拒绝(401)。同步来源切换为 Stream 模式后,HTTP 回调入口会关闭(403)。
:::

## 支持的增量事件

两种事件接收方式均支持以下飞书通讯录事件:

| 事件 | 在 NocoBase 中的处理 |
| --- | --- |
| `contact.user.created_v3` | 创建或更新用户。 |
| `contact.user.updated_v3` | 更新用户。 |
| `contact.user.deleted_v3` | 删除已同步用户。 |
| `contact.department.created_v3` | 创建或更新部门。 |
| `contact.department.updated_v3` | 更新部门。 |
| `contact.department.deleted_v3` | 删除已同步部门。 |

删除已同步用户时,拥有 Root 角色的用户不会被删除。

## 同步字段

### 部门字段

| 飞书字段 | NocoBase 字段或用途 |
| --- | --- |
| `open_department_id` | 部门的来源唯一标识。 |
| `name` | 部门名称。 |
| `parent_department_id` | 上级部门,用于建立部门层级。上级不在授权范围内时,当前部门作为根部门同步。 |

### 用户字段

| 飞书字段 | NocoBase 字段或用途 |
| --- | --- |
| 唯一标识字段取值 | 根据 **用户唯一标识字段** 生成用户的来源唯一标识和用户名。 |
| `name`,为空时 `en_name` | 用户昵称;均为空时昵称留空。 |
| `mobile` | 手机号。 |
| `email` | 邮箱。 |
| `department_ids` | 用户所属部门;只保留授权范围内的部门。 |
| `main_department_id` | 主部门。 |

### 部门负责人

NocoBase 会将部门信息中的负责人(部门 Leader)同步为部门主管:同一个用户可以是多个部门的负责人,负责人部门不一定是用户的主部门,只有授权范围内的部门参与同步。飞书侧取消负责人后,下次同步也会取消 NocoBase 中对应的主管标记;在 NocoBase 中手动修改的负责人可能在下次同步时被覆盖。

目前不同步头像、职位、工号等其他飞书用户字段。

## 故障排查

- 同步结果为空或缺少整个部门:检查通讯录权限是否开通,以及该部门是否在通讯录授权范围内。
- 用户昵称为空:检查是否开通 **获取用户基本信息**(`contact:user.base:readonly`)权限,开通后重新执行全量同步。
- 用户被跳过:检查用户是否具有当前配置的唯一标识字段取值,以及与认证器的唯一标识选择是否一致。
- HTTP 回调返回 401:未配置 Verification Token 或 Encrypt Key,或 Token 校验失败;返回 403:来源已切换为 Stream 模式。
- `redirect_uri` 或回调地址相关报错:确认飞书后台配置的地址与 NocoBase 界面显示的地址完全一致,子路径部署(`APP_PUBLIC_PATH`)时注意地址前缀。
- 同步任务失败并提示飞书接口调用频率限制:飞书开放平台 API 有调用量限制,等待限制解除后重新手动执行同步。
