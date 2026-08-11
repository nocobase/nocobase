---
pkg: '@nocobase/plugin-auth-ldap'
title: "从 LDAP 同步用户数据"
description: "复用已有 LDAP 认证器，将 LDAP 用户和部门同步到 NocoBase。"
keywords: "LDAP,用户同步,部门同步,Bind DN,Search DN,NocoBase"
---

# 从 LDAP 同步用户数据

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## 介绍

**认证：LDAP** 插件可以将已有的 LDAP 认证器作为用户数据同步来源。同步来源会复用认证器的 LDAP 连接、Bind DN、Search DN、搜索范围和属性映射，并将获取到的用户及可选的部门层级写入 NocoBase。

## 准备工作

1. 安装并启用 **认证：LDAP** 和 **用户数据同步** 插件。
2. 创建并验证一个 LDAP 认证器，参考[认证：LDAP](/auth-verification/auth-ldap/)。
3. 确认认证器的属性映射包含 NocoBase 所需字段，例如用户名或邮箱、昵称和手机号。

## 添加 LDAP 同步来源

进入 **用户和权限 > 同步**，点击 **添加**，类型选择 **LDAP**。

配置以下字段：

| 字段 | 说明 |
| --- | --- |
| 来源名称 | 当前同步来源的唯一名称。 |
| 启用 | 启用后可以执行手动同步和 LDAP 同步任务。 |
| LDAP 认证器 | 选择已有的 LDAP 认证器，复用其连接和属性映射。 |
| 同步过滤条件 | 同步用户时使用的 LDAP 过滤条件，默认为 `(&(objectCategory=person)(objectClass=user))`，请根据实际目录结构调整。 |
| 数量限制 | 单次 LDAP 搜索可返回的最大记录数。留空时使用 LDAP 服务端的默认限制。 |
| 分页大小 | LDAP 分页搜索的每页记录数。当目录记录数超过单次查询限制时使用。 |
| 同步部门 | 同时将 LDAP 组织层级同步为 NocoBase 部门。 |
| 部门搜索 DN | 启用部门同步后必填。填写包含待同步组织单元的 DN，例如 `ou=departments,dc=example,dc=com`。 |

:::info
同步来源使用所选认证器的 Bind DN 和 Bind password 搜索 LDAP，不会另外保存一份 LDAP 连接凭据。
:::

## 同步用户

保存并启用来源后，点击 **同步** 执行一次全量同步。可以通过 **任务** 查看同步结果，并重试失败的任务。

用户匹配方式由 LDAP 认证器中的 **用于绑定用户的字段** 决定。首次同步后应保持该设置和认证器属性映射稳定，避免产生重复用户。

## 同步部门

LDAP 目录中存在需要同步到 NocoBase 的组织层级时，启用 **同步部门** 并填写 **部门搜索 DN**。

插件会搜索该 DN 下的组织单元，保留上下级关系，并根据用户的 distinguished name 建立用户与部门的关联。部门搜索 DN 应覆盖待同步用户所关联的组织单元。

## 故障排查

- 没有返回用户时，检查认证器的 Search DN、搜索范围、Bind DN 权限和同步过滤条件。
- 同步结果被截断时，配置分页大小，并检查 LDAP 服务端的数量限制。
- 部门缺失时，确认已启用部门同步，并检查部门搜索 DN 是否覆盖目标组织单元。
- 在同步任务详情和应用日志中查看 LDAP 连接、绑定及搜索错误。
