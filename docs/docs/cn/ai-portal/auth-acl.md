---
title: "认证与权限"
description: "AI Portal 复用 NocoBase 的认证体系和 ACL，控制终端用户怎么登录、能看到什么、能操作什么。"
keywords: "AI Portal,认证,登录,ACL,权限,角色,CanAccess,OIDC,SAML"
---

# 认证与权限

:::tip 前置条件

阅读本页前，请确保你已按照 [AI 搭建快速开始](./index.md) 跑通了第一个 Portal。

:::

Portal 的用户体系直接用 NocoBase 的——同一批账号、同一套角色、同一份权限配置。你不需要在前端另做一套。

:::tip 提示

本页讲的是终端用户访问 Portal 时的登录和权限。如果你要了解的是 AI Agent 操作 NocoBase 时的鉴权，请参阅 [安全与审计](../ai-builder/security.md)。

:::

## 登录

账号密码登录开箱即用，模板已经接好了。登录页在 `src/pages/login/index.tsx`，默认就一行：

```tsx
import { DefaultSignInPage } from "@/components/auth/default-sign-in-page";

export const Login = () => {
  return <DefaultSignInPage />;
};
```

`DefaultSignInPage` 会读取服务端启用了哪些认证方式，然后渲染对应的登录表单和按钮。也就是说，你在 NocoBase 里启用了钉钉登录，登录页自然就会多一个钉钉按钮，前端不用改代码。

## 第三方认证方式

NocoBase 支持 OIDC、SAML、CAS、LDAP、短信、钉钉、企业微信等[认证方式](../auth-verification/auth/index.md)。这些方式在服务端启用后，前端需要对应的适配器才能渲染出登录入口。

适配器通过扩展提供，一个适配器声明它负责哪种 `authType`，以及渲染成表单还是按钮：

```ts
import type { AuthenticatorAdapter } from "@/components/auth/types";

const adapter: AuthenticatorAdapter = {
  authType: "OIDC",
  placement: "button", // 渲染成登录按钮，"form" 则是表单
  Component: OidcSignInButton,
};
```

扩展把它挂在 `authAdapters` 上，模板会自动收集。让 AI 加认证方式时，直接说就行：

```
NocoBase 里已经启用了钉钉登录，帮 main portal 的登录页加上钉钉登录按钮
```

<!-- 需要一张登录页同时显示账号密码表单和第三方登录按钮的截图 -->

## 自定义登录页

两种做法，按需要的定制程度选：

**只换某个认证方式的 UI** — 继续用 `DefaultSignInPage`，通过 `renderAuthenticator` 覆盖单个认证方式的渲染。动态认证的能力保留，其他方式不受影响。

**整页重做** — 直接改 `src/pages/login/index.tsx`，写自己的页面。适合有明确设计稿、要求完全一致的场景。

## 权限控制

NocoBase 的 ACL 结果会同步到前端，页面可以据此决定显示什么。`nocobase-acl` 扩展提供了几个组件：

| 组件 | 用途 |
| --- | --- |
| `CanAccess` | 最基础的权限判断，包住任意内容 |
| `AclPage` | 页面级权限，没权限时整页替换成提示 |
| `AclRegion` | 区域级权限，隐藏或替换页面里的某一块 |
| `AclField` | 字段级权限，按 NocoBase 的字段白名单控制 |
| `RoleSwitcher` | 角色切换器，可以放在任意位置 |

典型用法：

```tsx
<AclPage roles={{ anyOf: ["admin", "auditor"] }}>
  <AclRegion resource="auditLogs" action="list">
    <AuditLogTable />
  </AclRegion>
</AclPage>
```

角色约束支持三种写法：

- `anyOf` — 满足其中任意一个角色
- `allOf` — 需要同时具备所有角色
- `noneOf` — 不能是这些角色

需要在代码里拿到当前生效的角色时，用 `useGetRoles()`：

```tsx
import { useGetRoles } from "@/lib/nocobase/acl";

const { data: roles, isLoading } = useGetRoles();
```

返回的是当前生效的 ACL 角色集合，不是用户被分配的全部角色。这两者在联合角色模式下不一样。

## 单角色与联合角色

NocoBase 有两种角色模式，会影响前端的判断逻辑：

- **单角色模式** — 用户一次只以一个角色登录，角色约束判断的就是这一个角色
- **联合角色模式** — 用户的多个角色权限合并生效，角色约束判断的是参与合并的整个集合

切换角色会保存选择并刷新页面，这样导航、路由、数据访问和权限查询都从同一份结果出发，不会出现页面局部权限不一致的情况。

## 资源的 ACL 声明

扩展注册资源时，用 `meta.acl` 声明这个资源怎么参与权限判断：

```tsx
{
  name: "customers",
  list: "/customers",
  meta: {
    acl: { type: "collection" }, // 按数据表权限判断
  },
}
```

`type` 有几种取值：`collection` 走数据表权限，`authenticated` 只要求已登录，另外还有 `snippet` 和 `route`。不声明的话不参与 NocoBase 的权限检查。

## 验证权限配置

改动涉及权限时，跑一下回归脚本：

```bash
pnpm test:acl
```

认证相关的改动则跑：

```bash
pnpm test:auth
```

## 相关链接

- [AI 搭建快速开始](./index.md) — 跑通第一个由 AI 编写的前端入口
- [数据与 API](./data-api.md) — 请求怎么携带身份信息
- [标准组件与扩展](./components.md) — 扩展怎么提供认证适配器
- [与 AI Agent 协作搭建](./agent-workflow.md) — 让 AI 帮你加认证方式
- [安全与审计](../ai-builder/security.md) — AI Agent 操作 NocoBase 时的鉴权
- [用户认证](../auth-verification/auth/index.md) — NocoBase 支持的认证方式
- [用户管理](../users-permissions/user.md) — 用户体系的配置方式
- [权限配置](../ai-builder/acl.md) — 用 AI 配置角色和权限策略
