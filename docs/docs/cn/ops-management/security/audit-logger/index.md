---
pkg: '@nocobase/plugin-audit-logger'
---

# 审计日志

## 介绍

审计日志用于记录和追踪系统内的用户活动和资源操作历史。

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## 参数说明

| 参数                  | 说明                                                             |
| --------------------- | ---------------------------------------------------------------- |
| **Resource**          | 操作的目标资源类型                                               |
| **Action**            | 执行操作类型                                                     |
| **User**              | 操作用户                                                         |
| **Role**              | 用户操作时角色                                                   |
| **Data source**       | 数据源                                                           |
| **Target collection** | 目标数据表                                                       |
| **Target record UK**  | 目标数据表唯一标识                                               |
| **Source collection** | 关系字段源数据表                                                 |
| **Source record UK**  | 关系字段源数据表唯一标识                                         |
| **Status**            | 操作请求响应的 HTTP 状态码                                       |
| **Created at**        | 操作时间                                                         |
| **UUID**              | 操作的唯一标识，和操作请求的 Request ID 一致，可用于检索应用日志 |
| **IP**                | 用户的 IP 地址                                                   |
| **UA**                | 用户 UA 信息                                                     |
| **Metadata**          | 操作请求的参数、请求体和响应内容等元数据                         |

## 审计资源说明

目前有以下资源操作会被记录到审计日志中：

### 主应用

| 操作             | 说明         |
| ---------------- | ------------ |
| `app:resart`     | 应用重启     |
| `app:clearCache` | 清除应用缓存 |

### 插件管理器

| 操作         | 说明     |
| ------------ | -------- |
| `pm:add`     | 添加插件 |
| `pm:update`  | 更新插件 |
| `pm:enable`  | 启用插件 |
| `pm:disable` | 禁用插件 |
| `pm:remove`  | 移除插件 |

### 用户认证

| 操作                  | 说明     |
| --------------------- | -------- |
| `auth:signIn`         | 登录     |
| `auth:signUp`         | 注册     |
| `auth:signOut`        | 注销     |
| `auth:changePassword` | 修改密码 |

### 用户

| 操作                  | 说明         |
| --------------------- | ------------ |
| `users:updateProfile` | 修改个人资料 |

### UI 配置

| 操作                       | 说明           |
| -------------------------- | -------------- |
| `uiSchemas:insertAdjacent` | 插入 UI Schema |
| `uiSchemas:patch`          | 修改 UI Schema |
| `uiSchemas:remove`         | 移除 UI Schema |

### 数据表操作

| 操作             | 说明             |
| ---------------- | ---------------- |
| `create`         | 创建记录         |
| `update`         | 更新记录         |
| `destroy`        | 删除记录         |
| `updateOrCreate` | 更新或创建记录   |
| `firstOrCreate`  | 查询或创建记录   |
| `move`           | 移动记录         |
| `set`            | 设置关系字段记录 |
| `add`            | 添加关系字段记录 |
| `remove`         | 移除关系字段记录 |
| `export`         | 导出记录         |
| `import`         | 导入记录         |

## 添加其他审计资源

如果你通过插件扩展了其他资源操作，并希望将这些资源操作行为记录到审计日志中，可以参考 [API](/api/server/audit-manager.md).
