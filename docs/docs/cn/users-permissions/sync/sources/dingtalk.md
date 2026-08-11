---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "从钉钉同步用户数据"
description: "将钉钉用户和部门同步到 NocoBase，并通过 HTTP 回调或 Stream 模式接收增量变更。"
keywords: "钉钉,DingTalk,用户同步,部门同步,Stream 模式,事件订阅,NocoBase"
---

# 从钉钉同步用户数据

<PluginInfo commercial="true" name="auth-dingtalk"></PluginInfo>

## 介绍

**钉钉**插件支持将钉钉组织中的用户和部门同步到 NocoBase。除了手动执行全量同步，还可以通过 HTTP 回调或 Stream 长连接接收增量变更。

## 准备工作

1. 安装并启用 **钉钉** 和 **用户数据同步** 插件。
2. 在钉钉开发者后台创建企业内部应用。
3. 为应用开通所需的通讯录读取权限并配置可见范围。只有已授权的部门和用户可以被同步。
4. 复制应用的 Client ID 和 Client Secret。凭据配置可以参考[认证：钉钉](/auth-verification/auth-dingtalk/)。

## 添加钉钉同步来源

进入 **用户和权限 > 同步**，点击 **添加**，类型选择 **钉钉**。

配置以下字段：

| 字段 | 说明 |
| --- | --- |
| 来源名称 | 当前同步来源的唯一名称。 |
| 启用 | 启动当前来源的事件接收，并允许执行同步任务。 |
| Client ID | 钉钉企业内部应用的 Client ID，支持使用环境变量和密钥。 |
| Client Secret | 钉钉企业内部应用的 Client Secret，支持使用环境变量和密钥。 |
| 用户唯一标识字段 | 可选择 `mobile` 或 `unionId`。首次同步后应保持该选项稳定；缺少所选字段的用户会被跳过。 |
| 事件接收模式 | 选择 **HTTP 回调** 或 **Stream 模式**，接收用户和部门的增量变更。 |

保存并启用来源后，先点击 **同步** 完成首次全量同步，再使用事件订阅处理后续增量变更。

## 选择事件接收模式

### Stream 模式

Stream 模式由 NocoBase 服务端主动与钉钉建立持久连接，不需要公网回调地址、Token 或 EncodingAESKey。

1. 在钉钉开发者后台进入应用的事件订阅设置，选择 **Stream 模式**。
2. 订阅应用需要的用户和部门变更事件。
3. 在 NocoBase 中选择 **Stream 模式**，保存并启用同步来源。

同步来源启用后会启动 Stream 客户端。更新、停用或删除来源时，对应连接会刷新或关闭。

:::info
NocoBase 服务端需要能够主动访问钉钉。Stream 模式不要求配置反向代理，也不需要提供公网入站回调地址。
:::

### HTTP 回调

HTTP 回调模式通过 NocoBase 的回调地址接收钉钉事件。

1. 在 NocoBase 中选择 **HTTP 回调**。
2. 填写钉钉事件订阅所配置的 Token 和 EncodingAESKey。
3. 保存来源并复制生成的 **事件回调 URL**。
4. 将该 URL 配置到钉钉开发者后台，并订阅需要的用户和部门事件。

回调地址必须能够被钉钉访问。生产环境应通过 HTTPS 暴露该地址，并确保反向代理完整转发请求路径。

## 支持的增量事件

两种事件接收模式均支持以下钉钉事件：

| 事件 | 在 NocoBase 中的处理 |
| --- | --- |
| `user_add_org` | 创建或更新用户。 |
| `user_modify_org` | 更新用户。 |
| `user_leave_org` | 删除已同步用户。 |
| `org_dept_create` | 创建或更新部门。 |
| `org_dept_modify` | 更新部门并同步该部门的用户。 |
| `org_dept_remove` | 删除已同步部门。 |

## 故障排查

- 用户或部门缺失时，检查钉钉应用的通讯录权限和可见范围。
- 用户被跳过时，检查用户是否具有当前配置的唯一标识字段。
- Stream 模式可以在应用日志中搜索 `Dingtalk stream client starting`、`Dingtalk stream client started` 或连接错误。
- HTTP 回调模式需要确认回调地址可被公网访问，并检查 Token 和 EncodingAESKey 是否与钉钉配置一致。
- 修改钉钉应用权限或可见范围后，重新执行一次手动全量同步。
