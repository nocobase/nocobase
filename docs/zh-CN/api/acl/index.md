# ACL 权限管理

ACL 为 Nocobase 中的权限控制模块。在 ACL 中注册角色、资源以及配置相应权限之后，即可对角色进行权限判断。

## 概念解释

* 角色 (`ACLRole`)：权限判断的对象
* 资源 (`ACLResource`)：在 Nocobase ACL 中，资源通常对应一个数据库表，概念上可类比为 Restful API 中的 Resource。
* Action：对资源的操作，如 `create`、`read`、`update`、`delete` 等。
* 授权：在 `ACLRole` 实例中调用 `grantAction` 函数，为角色授予 `Action` 的访问权限。
* 鉴权：在 `ACL` 实例中调用 `can` 函数，函数返回结果既为用户的鉴权结果。



