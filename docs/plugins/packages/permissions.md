---
title: '@nocobase/plugin-permissions'
---

# @nocobase/plugin-permissions

提供权限模块

## 安装

```bash
yarn nocobase pull permissions --start
```

## API

<Alert title="还需改进的一些细节" type="warning">

- 提供 Permission Model 相关快捷数据操作 API
- 需要支持从代码层面快捷配置权限，无需经由后台  
  系统表相关操作权限可能是直接通过权限 api 配置或者 permission model api，直接写入数据库
- 提供 ui schema 需要的 fields/actions/pages 相关  permission api  
  现在有个 ac.can 可用，实际体验不够直接
- 数据表权限设置只开放了业务表，系统表权限需要开发自行处理，但无提供相关 api  
  如操作记录表、中国行政区表、附件表的情况：
  - 操作记录表只开放查看，只能查看自己有权限能查看的数据表的操作
  - 中国行政区的省市区等数据仅登录用户可查看
  - 附件暂时没做权限限制

</Alert>

### context.ac.isRoot

是否为 root 权限

### context.ac.can(collection)

判断当前用户权限，支持链式操作。

#### ac.can(collection).permissions()

获取当前 collection 的所有权限配置

#### ac.can(collection).act(actionName).any()

是否允许 collection:actionName 操作，允许则返回相关配置

#### ac.can(collection).act(actionName).one(resourceKey)

具体 resourceKey 值的 collection，是否允许 collection:actionName 操作，允许则返回相关配置

#### ac.as(roles).can(collection)

指定 roles 的权限判断