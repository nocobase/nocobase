# 权限控制

在 NocoBase 中，**权限控制**既可以通过界面配置，也可以在代码中灵活定义。

## 界面配置
在「角色和权限」面板中，可以针对可配置的 Collection 设置对应数据表的操作权限。

## 代码配置
在代码中，可以通过指定接口的方式设置权限。

### 1. 自定义操作权限
通过自定义 `Condition` 来限制某个资源和操作的访问权限：

```ts
this.app.acl.allow(resource, action, condition);
```

### 2. 自定义权限片段（Snippet）
可以将常用的权限组合注册为 snippet，角色绑定后即可快速应用：

```ts
this.app.acl.registerSnippet({
  name: 'pm',
  actions: ['pm:*'],
});
```

### 3. 自定义可配置的操作
如果需要让某些自定义操作也能在界面上配置权限，可以使用 `setAvailableAction` 注册：

```ts
this.app.acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}',
  type: 'new-data',
  onNewRecord: true,
})
```
