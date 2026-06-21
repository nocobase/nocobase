---
title: "ACL"
description: "NocoBase 服务端 ACL API：allow/deny 配置资源权限、角色访问控制。"
keywords: "ACL,allow,deny,权限配置,角色访问控制,资源权限,NocoBase"
---

# ACL

## allow()

```ts
allow(resourceName: string, actionNames: string[] | string, condition?: string | ConditionFunc)
```