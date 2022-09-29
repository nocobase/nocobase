# ACLAvailableStrategy

ACL 角色的权限策略，可以使用其判断角色是否有权限访问资源。

## 类方法

### `constructor(acl: ACL, options: AvailableStrategyOptions)`

构造函数，创建一个 `ACLAvailableStrategy` 实例。

### `allow(resourceName: string, actionName: string)`

判断此策略是否允许给定的资源和动作通过鉴权。

## 基础数据结构

### `AvailableStrategyOptions`

策略定义参数，用以描述一组权限配置规则。

* displayName - 策略名称
* allowConfigure - 此策略是否拥有 **配置资源** 的权限，设置此项为`true`之后，请求判断在 `ACL` 中注册成为 `configResources` 资源的权限，会返回通过。
* actions - 策略内的 actions 列表，支持通配符 `*`
* resource - 策略内的 resource 定义，支持通配符 `*`
