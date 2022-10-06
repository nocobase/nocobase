# ACLAvailableAction

用于表示一个可用 ACL Action 的数据结构。

## 类方法

### `constructor(public name: string, public options: AvailableActionOptions)`

实例化 ACLAvailableAction

**参数**

* name: string - 动作名称
* options: AvailableActionOptions
  * displayName - action 显示名称
  * aliases - action 别名
  * resource - action 所属资源名称
  * onNewRecord - action 是否是在创建新的数据库记录
  * allowConfigureFields - action 是否允许配置字段
