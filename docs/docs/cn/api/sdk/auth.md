# Auth

## 概览

`Auth` 类主要用于在客户端存取用户信息，请求用户认证相关接口。

## 实例属性

### `locale`

当前用户使用的语言。

### `role`

当前用户使用的角色。

### `token`

API 接口 `token`.

### `authenticator`

当前用户认证时所用的认证器。参考 [用户认证](/auth-verification/auth/)。

## 类方法

### `signIn()`

用户登录。

#### 签名

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### 详细信息

| 参数名          | 类型     | 描述                 |
| --------------- | -------- | -------------------- |
| `values`        | `any`    | 登录接口请求参数     |
| `authenticator` | `string` | 登录使用的认证器标识 |

### `signUp()`

用户注册。

#### 签名

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### 详细信息

| 参数名          | 类型     | 描述                 |
| --------------- | -------- | -------------------- |
| `values`        | `any`    | 注册接口请求参数     |
| `authenticator` | `string` | 注册使用的认证器标识 |

### `signOut()`

注销登录。

#### 签名

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### 详细信息

| 参数名          | 类型     | 描述                 |
| --------------- | -------- | -------------------- |
| `values`        | `any`    | 注销接口请求参数     |
| `authenticator` | `string` | 注销使用的认证器标识 |
