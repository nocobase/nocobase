# ACL

## HTTP API

```bash
# 角色列表
GET     /api/roles:list
# 创建角色
POST    /api/roles:create
# 角色详情
GET     /api/roles:get/:name
# 更新
PUT     /api/roles:update/:name
# 删除
DELETE  /api/roles:destroy/:name

# 配置权限
POST    /api/roles/:name/resources:create
# 资源权限列表
GET     /api/roles/:name/resources:get/:resourceName
# 更新
PUT     /api/roles/:name/resources:update/:resourceName

# 菜单配置
GET     /api/roles/:name/menu_items
# 附件关联
POST    /api/roles/:name/menu_items:add/:uid

# 数据范围
GET     /api/roles_resources_scopes
POST    /api/roles_resources_scopes
GET     /api/roles_resources_scopes/:id
PUT     /api/roles_resources_scopes/:id
DELETE  /api/roles_resources_scopes/:id
```

## Examples

通用权限配置

```bash
PUT     /api/roles/:name
# request body
{
  strategy: 's1',
}
```

获取资源配置

```bash
GET     /api/roles/:name/resources/:resourceName
# response
{
  data: {
    name: 'tests',
    singleton: true, # 单独配置时为 true
    actions: [
      {
        name: 'create',
        scope: 1,
        fields: ['name', 'title'],
      }
    ],
  }
}
```

配置资源权限（新增）

```bash
POST    /api/roles/:roleName/resources
# request body
{
  name: 'tests',
  singleton: true, # 单独配置时为 true
  actions: [
    {
      name: 'create',
      scope: 1,
      fields: ['name', 'title'],
    }
  ],
}
```

配置资源权限（修改）

```bash
POST    /api/roles/:roleName/resources/:resourceName
# request body
{
  name: 'tests',
  singleton: true, # 单独配置时为 true
  actions: [
    {
      name: 'create',
      scope: 1,
      fields: ['name', 'title'],
    }
  ],
}
```
