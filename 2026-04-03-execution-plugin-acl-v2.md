# Execution Plan

## 原始计划

# plugin-acl 精简版 client-v2 迁移计划（当前阶段）

## Summary
当前阶段只做 `plugin-acl` 在 `client-v2` 的 **运行时 ACL 基础能力**，以及支撑 `UI Editor` 正常显隐和生效所需的能力。  
以下内容本阶段 **明确不考虑**：
- `SettingsCenterDropdown`
- 角色与权限管理页
- 角色列表增删改
- `roleMode`
- 系统权限页
- 桌面路由权限页
- 插件设置权限页
- `SwitchRole`
- `Plugin manager` 页面

完成标准：
- `plugin-acl` 的 `client-v2` 不再是 demo，而是提供真实 ACL 运行时
- v2 能正确执行 `roles:check`
- `UI Editor` 在 v2 中按 ACL 正确显隐，并能联动 designable / flow settings
- v2 具备最小可用的 ACL allow 判断与运行时裁剪基础，不依赖 `@nocobase/client`

## Key Changes
### 1. 把 ACL 运行时基础迁到 `@nocobase/client-v2`
- 提供并正式导出：
  - `ACLContext`
  - `ACLRolesCheckProvider`
  - `useACLContext`
  - `useACLRoleContext`
  - `useUIConfigurationPermissions`
  - `useRoleRecheck`
  - `useCurrentRoleMode`
- `roles:check` 同步的数据至少包括：
  - `roleMode`
  - `allowAll`
  - `allowConfigure`
  - `availableActions`
  - `actionAlias`
  - `allowMenuItemIds`
  - `allowAnonymous`
  - `uiButtonSchemasBlacklist`
  - `meta.dataSources`
- 当不具备 `ui.*` 时，主动关闭 designable / flow settings。

### 2. 在 v2 提供统一的 ACL allow 判断
- ACL 判断沿用 v1 的 ignore 语义，支持：
  - `ui.*`
  - `!ui.*`
  - 以及其他正反向 snippets
- 在 `client-v2` 提供统一的 allow 工具，避免后续继续写成简单 `snippets.includes(...)`。
- 右上角 header actions 过滤统一走这套 allow 逻辑。

### 3. 只迁 `UI Editor`，不迁 `SettingsCenterDropdown`
- 把 v1 内建插件里的 `ui` header action 迁到 v2：
  - 注册 v2 版 `DesignableSwitch`
  - `snippet` 仍为 `ui.*`
- `PinnedPluginListLite` 改为支持 ACL 过滤，但本阶段只用来控制 `UI Editor` 这一项。
- `SettingsCenterDropdown` 本阶段不迁，也不在右上角出现。

### 4. 补齐最小运行时裁剪能力
- 为了保证 ACL 在 v2 不只是“入口显隐”，本阶段补最小必需裁剪能力：
  - action/button 级权限判断
  - `uiButtonSchemasBlacklist` 生效
  - 后续可复用的字段/资源动作裁剪基础接口
- 这部分先服务于 v2 当前页面与 `UI Editor` 相关场景，不扩展到完整角色管理页需求。

### 5. 把 `plugin-acl/client-v2` 从 demo 改为真实运行时插件
- 替换当前 demo 插件内容。
- 插件 `load()` 负责：
  - 安装 ACL 运行时 provider
  - 注册 ACL locale
  - 注册 `UI Editor` 相关 header action
  - 补必要的 ACL 初始化逻辑
- 不注册角色管理页、不注册设置页入口、不注册 `SwitchRole`。

## Public APIs / Interfaces
- `@nocobase/client-v2` 新增并正式导出：
  - `ACLContext`
  - `ACLRolesCheckProvider`
  - `useACLContext`
  - `useACLRoleContext`
  - `useUIConfigurationPermissions`
  - `useRoleRecheck`
  - `useCurrentRoleMode`
  - ACL snippets allow 工具
- `@nocobase/plugin-acl/client-v2` 导出真实插件入口，不再是 demo。

## Test Plan
- ACL 运行时
  - `/v2/admin` 会请求 `roles:check`
  - `app.context.acl` 能同步关键 ACL 数据
  - 无 `ui.*` 时 designable 会被关闭
- allow 判断
  - `ui.*` 正向权限生效
  - `!ui.*` 反向 snippets 也能正确生效
- 右上角入口
  - 有 `ui.*` 的用户能看到 `UI Editor`
  - 无 `ui.*` 的用户看不到 `UI Editor`
  - 点击 `UI Editor` 后能正确联动 designable / flow settings
- 运行时裁剪
  - `uiButtonSchemasBlacklist` 能禁用对应按钮
- 回归
  - `plugin-auth` v2 链路不受影响
  - v1 `client` 侧 `plugin-acl` 行为不受影响

## Assumptions
- 当前阶段只解决 ACL 运行时和 `UI Editor` 权限链路，不处理设置中心和角色权限管理页面。
- 服务端 ACL 接口和数据结构保持不变，迁移只发生在 `client-v2` 和 `plugin-acl/client-v2`。
- 后续如果要继续做 `SettingsCenterDropdown` 或角色权限管理页，再在这个基础上增量扩展。

## To do list

- [x] 同步飞书文档中的 `plugin-acl` 当前阶段范围
- [x] 建立执行跟踪文件并核对当前代码入口
- [x] 在 `client-v2` 补齐 ACL context / hooks / allow 工具
- [x] 将 `PinnedPluginListLite` 和内建插件切到 ACL 过滤 + `UI Editor`
- [x] 将 `plugin-acl/client-v2` 从 demo 改为真实运行时插件
- [x] 运行定向校验并回归 `/v2/admin`
