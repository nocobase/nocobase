# ACL 权限控制

ACL（Access Control List）用于控制资源操作权限。你可以将权限赋予角色，也可以跳过角色限制直接约束权限。ACL 系统提供了灵活的权限管理机制，支持权限片段、中间件、条件判断等多种方式。

:::tip 注意

ACL 对象归属于数据源（`dataSource.acl`），主数据源的 ACL 可以通过 `app.acl` 快捷访问。其他数据源的 ACL 使用方式详见 [数据源管理](./data-source-manager.md) 章节。

:::

## 注册权限片段（Snippet）

权限片段（Snippet）可以将常用的权限组合注册为可复用的权限单元。角色绑定 snippet 后即可获得对应的一组权限，这样可以减少重复配置，提高权限管理的效率。

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // ui.* 前缀表示允许在界面上配置的权限
  actions: ['customRequests:*'], // 对应资源操作，支持通配符
});
```

## 跳过角色约束的权限（allow）

`acl.allow()` 用于允许某些操作绕过角色约束，适用于公开 API、需要动态判断的权限场景，或者需要基于请求上下文进行权限判断的情况。

```ts
// 公开访问，无需登录
acl.allow('app', 'getLang', 'public');

// 已登录用户即可访问
acl.allow('app', 'getInfo', 'loggedIn');

// 基于自定义条件判断
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**condition 参数说明：**

- `'public'`：任何用户（包括未登录用户）都可访问，无需任何身份验证
- `'loggedIn'`：仅已登录用户可访问，需要有效的用户身份
- `(ctx) => Promise<boolean>` 或 `(ctx) => boolean`：自定义函数，根据请求上下文动态判断是否允许访问，可以实现复杂的权限逻辑

## 注册权限中间件（use）

`acl.use()` 用于注册自定义权限中间件，可以在权限检查流程中插入自定义逻辑。通常和 `ctx.permission` 一起搭配使用，用于自定义权限规则。适用于需要实现非常规权限控制的场景，比如公开表单需要自定义密码验证、基于请求参数的动态权限判断等。

**典型应用场景：**

- 公开表单场景：无用户无角色，但需要通过自定义密码来约束权限
- 基于请求参数、IP 地址等条件的权限控制
- 自定义权限规则，跳过或修改默认的权限检查流程

**通过 `ctx.permission` 控制权限：**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // 示例：公开表单需要验证密码后跳过权限检查
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // 验证通过，跳过权限检查
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // 执行权限检查（继续 ACL 流程）
  await next();
});
```

**`ctx.permission` 属性说明：**

- `skip: true`：跳过后续的 ACL 权限检查，直接允许访问
- 可以在中间件中根据自定义逻辑动态设置，实现灵活的权限控制

## 为特定操作添加固定数据约束（addFixedParams）

`addFixedParams` 可以为某些资源的操作添加固定的数据范围（filter）约束，这些约束会绕过角色限制直接应用，通常用于保护系统关键数据。

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// 即使用户拥有删除角色的权限，也无法删除 root、admin、member 这些系统角色
```

> **提示：** `addFixedParams` 可用于防止敏感数据被误删或修改，比如系统内置角色、管理员账户等。这些约束会与角色权限叠加生效，确保即使拥有权限也无法操作被保护的数据。

## 判断权限（can）

`acl.can()` 用于判断某个角色是否有权限执行指定操作，返回权限结果对象或 `null`。常用于在业务逻辑中动态判断权限，比如在中间件或操作的 Handler 中根据角色决定是否允许执行某些操作。

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // 可以传入单个角色或角色数组
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`角色 ${result.role} 可以执行 ${result.action} 操作`);
  // result.params 包含了通过 addFixedParams 设置的固定参数
  console.log('固定参数:', result.params);
} else {
  console.log('无权限执行该操作');
}
```

> **提示：** 如果传入多个角色，会依次检查每个角色，返回角色的并集结果。

**类型定义：**

```ts
interface CanArgs {
  role?: string;      // 单个角色
  roles?: string[];   // 多个角色（会依次检查，返回第一个有权限的角色）
  resource: string;   // 资源名称
  action: string;    // 操作名称
}

interface CanResult {
  role: string;       // 有权限的角色
  resource: string;   // 资源名称
  action: string;    // 操作名称
  params?: any;       // 固定参数信息（如果通过 addFixedParams 设置了的话）
}
```

## 注册可配置操作（setAvailableAction）

如果你希望自定义操作可以在界面上配置权限（比如在角色管理页面中显示），需要使用 `setAvailableAction` 进行注册。注册后的操作会出现在权限配置界面中，管理员可以在界面上配置不同角色的操作权限。

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // 界面显示名称，支持国际化
  type: 'new-data',               // 操作类型
  onNewRecord: true,              // 是否在新记录创建时生效
});
```

**参数说明：**

- **displayName**：在权限配置界面显示的名称，支持国际化（使用 `{{t("key")}}` 格式）
- **type**：操作类型，决定该操作在权限配置中的分类
  - `'new-data'`：创建新数据的操作（如导入、新增等）
  - `'existing-data'`：修改已有数据的操作（如更新、删除等）
- **onNewRecord**：是否在新记录创建时生效，仅对 `'new-data'` 类型有效

注册后，该操作会出现在权限配置界面中，管理员可以在角色管理页面中配置该操作的权限。
