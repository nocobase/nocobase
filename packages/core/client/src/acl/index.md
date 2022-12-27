---
nav:
  title: Client
  path: /client
group:
  title: Client
  path: /client
---

# ACL

Collection 资源权限
相关 Provider

## `ACLProvider`

提供权限配置，plugin-acl 的前端模块

```tsx | pure
const app = new Application({});

app.use(ACLProvider);
app.use([SchemaComponentProvider, { components: { Hello } }]);
app.use((props) => {
  return (
    <div>
      <Link to={'/'}>Home</Link>,<Link to={'/about'}>About</Link>
      <RouteSwitch routes={routes} />
    </div>
  );
});

app.mount('#root');
// 等于
ReactDOM.render(<App />, document.getElementById('root'));
```

## `ACLRolesCheckProvider`

在这个 Provider 里发起请求'roles:check'，将获取到当前角色的权限配置信息,通过上下文的关系供后代组件使用

```
 const ctx = useContext(ACLContext);
  {
    //单独配置的资源
    resources:[],
    // action 别名
    actionAlias:[],
    //是否root角色
    allowAll:true,
    //菜单 IDS
    allowMenuItemIds:[],
    // 允许匿名
    allowAnonymous:true,
    //插件管理权限,配置中心配置权限，UI配置权限
    snippets:["plugin-manager", "settings-center.*", "ui-editor"],
    // 通用权限策略
    strategy:[]

  }
```

## `ACLCollectionProvider`
每一个区块最终都被ACLCollectionProvider包裹，形成上下文关系，ACLCollectionProvider 判断区块权限，通过则return children,否则return null

## `ACLActionProvider `
action 级别的鉴权，每一个需要鉴权的action应都由ACLActionProvider包裹，可以以decorator的形式使用 'x-decorator': 'ACLActionProvider',同时action的schema里应有acion的标识 'x-action': 'view',
用于 schema 中，前端在需要权限控制的 schema 上添加 x-acl-action 的标记，可用在区块或者操作按钮上，一般与 `<ACLCollectionProvider />` 或 `<ACLActionProvider />` 结合使用，有些特殊场景特殊处理


## `ACLCollectionFieldProvider`
字段级别的鉴权，待补充

## `ACLMenuItemProvider `
菜单的鉴权，待补充
