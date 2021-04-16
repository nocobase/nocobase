---
title: '@nocobase/plugin-users'
---

# @nocobase/plugin-users

提供用户模块

<Alert title="注意" type="warning">
用户模块目前的实现较简单
</Alert>

## 安装

```bash
yarn nocobase pull users --start
```

## Action API

### users:check

检查用户是否已登录

```ts
await api.resource('users').check();
```

### users:login

登录

```ts
await api.resource('users').login({
  values: {
    email,
    password,
  },
});
```

### users:register

注册

```ts
await api.resource('users').register({
  values: {
    email,
    password,
    ...others,
  },
});
```

### users:logout

注销

<Alert title="注意" type="warning">
注销后端暂无任何处理，实际需要清除 token。
</Alert>

```ts
await api.resource('users').logout();
```

### users:lostpassword

忘记密码

```ts
await api.resource('users').lostpassword({
  values: {
    email,
  }
});
```

### users:resetpassword

重置密码

<Alert title="注意" type="warning">
未实现邮件发送
</Alert>

```ts
await api.resource('users').lostpassword({
  values: {
    email,
    password,
    reset_token,
  }
});
```

### users:getUserByResetToken

根据 reset token 获取用户信息

```ts
await api.resource('users').getUserByResetToken({
  values: {
    reset_token,
  }
});
```


## Fields Types

### context <Badge>未实现</Badge>

上下文类型，可以从 app.context 里获取信息，如 UA、Client IP 等。利用 context 类型，createdBy/updatedBy 的实现也变得更简单了：

createdBy

```ts
{
  name: 'created_by_id',
  type: 'context',
  dataIndex: 'state.currentUser.id',
  createOnly: true,
}
```

updatedBy

```ts
{
  name: 'updated_by_id',
  type: 'context',
  dataIndex: 'state.currentUser.id',
}
```

## Field Interfaces

### createdBy

创建人

### updatedBy

最后更新人
